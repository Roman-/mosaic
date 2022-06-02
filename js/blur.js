/* Does Gaussain blur on image
   usage exmaple:
    var canvasBlur = new CanvasFastBlur({ blur: 6 });
	var blur = document.querySelector("#blur_val").value;
	canvasBlur.gBlur(blur);
	canvasBlur.recoverCanvas();
*/
class CanvasFastBlur {
    constructor(options) {
        const defaultRadius = 4;
        if (options && options.blur)
            this.blurRadius = options.blur || defaultRadius;
        else
            this.blurRadius = defaultRadius;
    }
    initCanvas(canvas){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        let w = canvas.width;
        let h = canvas.height;
        this.canvas_off = document.createElement("canvas");
        this.ctx_off = this.canvas_off.getContext("2d");
        this.canvas_off.width = w;
        this.canvas_off.height = h;
        this.ctx_off.drawImage(canvas, 0, 0);
    }
    recoverCanvas(){
        let w = this.canvas_off.width;
        let h = this.canvas_off.height;
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.drawImage(this.canvas_off,0,0);
    }
    gBlur(blur = 4) {
        blur = blur || this.blurRadius;
        let canvas = this.canvas;
        let ctx = this.ctx;

        let sum = 0;
        let delta = 5;
        let alpha_left = 1 / (2 * Math.PI * delta * delta);
        let step = blur < 3 ? 1 : 2;
        for (let y = -blur; y <= blur; y += step) {
            for (let x = -blur; x <= blur; x += step) {
                let weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
                sum += weight;
            }
        }
        let count = 0;
        for (let y = -blur; y <= blur; y += step) {
            for (let x = -blur; x <= blur; x += step) {
                count++;
                ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur;
                ctx.drawImage(canvas,x,y);
            }
        }
        ctx.globalAlpha = 1;
    }
    mBlur(distance){
        distance = distance<0?0:distance;
        console.log(distance);
        let w = this.canvas.width;
        let h = this.canvas.height;
        this.canvas.width = w;
        this.canvas.height = h;
        let ctx = this.ctx;
        ctx.clearRect(0,0,w,h);
        let canvas_off = this.canvas_off;

        for(let n=0;n<5;n+=0.1){
            ctx.globalAlpha = 1/(2*n+1);
            let scale = distance/5*n;
            ctx.transform(1+scale,0,0,1+scale,0,0);
            ctx.drawImage(canvas_off, 0, 0);
        }
        ctx.globalAlpha = 1;
        if(distance<0.01){
            window.requestAnimationFrame(()=>{
                this.mBlur(distance+0.0005);
            });
        }
    }
}
