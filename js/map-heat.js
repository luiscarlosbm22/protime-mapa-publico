/* Capa de calor compartida por Google Maps y el mapa offline.
   Acumula las horas-hombre de incidencias en la misma ubicación. */
const MapHeat = (() => {
    function groups(rows) {
        const locations = new Map();
        for (const row of rows) {
            const coords = mapCoords(row);if (!coords) continue;
            const key = `${coords.lat}|${coords.lon}`;
            if (!locations.has(key)) locations.set(key,{...coords,hours:0,count:0});
            const location = locations.get(key),hours = mapHours(row);
            location.hours += Number.isFinite(hours)?Math.max(0,hours):0;
            location.count++;
        }
        return [...locations.values()];
    }

    function raster(points,width,height) {
        // Media resolución para mantener fluidez al desplazar el mapa en móviles.
        const scale = .5,w = Math.max(1,Math.ceil(width*scale)),h = Math.max(1,Math.ceil(height*scale));
        const data = new Uint8ClampedArray(w*h*4);
        const palette={low:[30,194,104],medium:[255,190,24],high:[239,55,48]};
        const radius = Math.max(75,Math.min(125,width*.2))*scale;
        const edge = Math.exp(-4);
        for (const point of points) {
            if (!Number.isFinite(point.x)||!Number.isFinite(point.y)||!Number.isFinite(point.hours)) continue;
            const color=palette[mapColor(point.hours)];
            const cx = point.x*scale,cy = point.y*scale;
            const left = Math.max(0,Math.floor(cx-radius)),right = Math.min(w-1,Math.ceil(cx+radius));
            const top = Math.max(0,Math.floor(cy-radius)),bottom = Math.min(h-1,Math.ceil(cy+radius));
            for (let y=top;y<=bottom;y++) for (let x=left;x<=right;x++) {
                const distance = ((x-cx)**2+(y-cy)**2)/(radius**2);
                if (distance>1) continue;
                const influence = (Math.exp(-4*distance)-edge)/(1-edge),i = (y*w+x)*4;
                const opacity=Math.round(influence*205);
                // En un cruce se conserva la mancha más cercana sin mezclar severidades.
                if (opacity<=data[i+3]) continue;
                data.set(color,i);
                data[i+3]=opacity;
            }
        }
        return {width:w,height:h,data};
    }

    function draw(canvas,points,width,height) {
        if (!width||!height) return;
        const field=raster(points,width,height);
        canvas.width=field.width;canvas.height=field.height;
        canvas.style.width=width+'px';canvas.style.height=height+'px';
        const context=canvas.getContext('2d');if (!context) return;
        const image=context.createImageData(field.width,field.height);image.data.set(field.data);
        context.putImageData(image,0,0);
    }

    function google(maps,map,rows) {
        let locations=groups(rows);
        const container=map.getDiv();
        class HeatOverlay extends maps.OverlayView {
            onAdd() {
                this.canvas=document.createElement('canvas');this.canvas.className='map-heat';
                this.canvas.setAttribute('aria-hidden','true');
                this.canvas.hidden=this.visible===false;
                // Google ordena esta capa por debajo de los marcadores y ventanas de detalle.
                this.getPanes().overlayLayer.append(this.canvas);
                this.resizeObserver=new ResizeObserver(()=>this.draw());
                this.resizeObserver.observe(container);
            }
            draw() {
                if (!this.canvas||this.canvas.hidden||this.frame!=null) return;
                this.frame=requestAnimationFrame(()=>{
                    this.frame=null;
                    if (this.canvas.hidden) return;
                    const projection=this.getProjection();if (!projection) return;
                    const center=map.getCenter();if (!center) return;
                    const paneCenter=projection.fromLatLngToDivPixel(center);
                    const screenCenter=projection.fromLatLngToContainerPixel(center);
                    if (!paneCenter||!screenCenter) return;
                    // Alinear el origen del lienzo con la ventana visible en este mismo fotograma.
                    this.canvas.style.left=(paneCenter.x-screenCenter.x)+'px';
                    this.canvas.style.top=(paneCenter.y-screenCenter.y)+'px';
                    const points=[];
                    for (const location of locations) {
                        const pixel=projection.fromLatLngToContainerPixel({lat:location.lat,lng:location.lon});
                        if (pixel) points.push({x:pixel.x,y:pixel.y,hours:location.hours});
                    }
                    draw(this.canvas,points,container.clientWidth,container.clientHeight);
                });
            }
            onRemove() {
                cancelAnimationFrame(this.frame);this.frame=null;
                this.resizeObserver?.disconnect();
                this.canvas?.remove();this.canvas=null;
            }
            setVisible(visible) {
                this.visible=visible;
                if(this.canvas)this.canvas.hidden=!visible;
                if(visible)this.draw();
            }
            setRows(rows) {locations=groups(rows);this.draw();}
        }
        const overlay=new HeatOverlay();overlay.setMap(map);
        return overlay;
    }
    return {groups,raster,draw,google};
})();
