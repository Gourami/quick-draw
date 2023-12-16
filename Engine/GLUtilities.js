export default class GLUtilities {
  static getGL(canvas) {
    if (typeof canvas.gl !== typeof undefined && canvas.gl.el === canvas.el) {
      return canvas.gl;
    } else {
      canvas.gl = canvas.el.getContext("webgl2");
      if (canvas.gl !== null) {
        canvas.gl.version = 3.0;
        console.log("running WebGL2");
        return canvas.gl;
      } else {
        canvas.gl = canvas.getContext("webgl");
        if (!canvas.gl) {
          canvas.version = null;
          console.log("Sorry, your device is not setup for Web GL");
          return null;
        } else {
          canvas.gl.version = 1.0;
          console.log("Running WebGL");
          return canvas.gl;
        }
      }
    }
  }

  /**
   *
   * @param {WebGLRenderingContext} gl
   * @param {Array of 1 vertShader and 1 fragShader} ss
   * @returns glProgram on success or null on failure
   */
  static initShaders(gl, ss) {
    let program = this.createProgram(gl, ss[0], ss[1]);
    if (!program) {
      console.log("Failed to create program");
      return null;
    }
    if (!gl.programs) gl.programs = [];
    gl.programs.push(program); //assign this program object to gl so it is accessible outside of initShaders
    return program;
  }

  static createProgram(gl, vShader, fShader) {
    let vertShader = this.loadShader(gl, vShader, gl.VERTEX_SHADER);
    let fragShader = this.loadShader(gl, fShader, gl.FRAGMENT_SHADER);
    if (!vertShader || !fragShader) {
      console.log("Invalid shader " + vertShader + " " + fragShader);
      return null;
    }

    //create program
    let program = gl.createProgram();
    //attach each shader
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    //link the program
    gl.linkProgram(program);

    let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      console.log("Failed to link program: " + program.getInfoLog());
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      return null;
    }

    return program;
  }

  /**
   *
   * @param {WebGLRenderingContext} gl
   * @param {string containing GLSL source code} source
   * @param {either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER} type
   * @returns
   */
  static loadShader(gl, source, type) {
    let shader = gl.createShader(type); //create GL shader
    gl.shaderSource(shader, source); //feed the new shader source code
    gl.compileShader(shader); //compile the shader source code

    let infoLog = gl.getShaderInfoLog(shader);
    if (infoLog.length > 0) {
      console.log("Failed to compile shader: " + infoLog);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * loadProgramInfo bootstraps the programInfo object to keep track of
   * uniform and attribute locations etc
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} prog
   * @returns Object
   */
  static loadProgramInfo(gl, prog) {
    // Collect all the info needed to use the shader program.
    // Look up locations for each attribute our shader program is using
    // Save it to AppState so it is available across the app
    const programInfo = {
      program: prog,
      attribLocations: [gl.getAttribLocation(prog, "aVertexPosition"), gl.getAttribLocation(prog, "aVertexColor")],
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(prog, "uProjectionMatrix"),
        viewMatrix: gl.getUniformLocation(prog, "uViewMatrix"),
        modelMatrix: gl.getUniformLocation(prog, "uModelMatrix"),
      },
    };

    return programInfo;
  }

  /**
   * resetViewport is a convenience function to reset the aspect ratio on window resize etc
   * @param {WebGLRenderingContext} gl
   */
  static resetViewport(gl, canvas) {
    // First - specify the affine transformation of x and y from
    // normalized device coordinates to window coordinates
    let dpr = window.devicePixelRatio;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, dpr * canvas.width, dpr * canvas.height);
  }

  /**
   * loadBuffers is a convenience function to load buffer data to GPU
   * @param {WebGLRenderingContext} gl
   * @param {BufferObject} bufferObjects
   */
  static loadBuffers(gl, bufferObjects) {
    for (let bo of bufferObjects) {
      gl.bindBuffer(bo.target, bo.glBufferID);
      gl.bufferData(bo.target, bo.data, bo.glUsage);

      if (bo.target === gl.ELEMENT_ARRAY_BUFFER) continue;

      gl.vertexAttribPointer(bo.glAttribLoc, bo.numComponents, bo.glDataType, false, 0, 0);
      gl.enableVertexAttribArray(bo.glAttribLoc);
    }
  }
}
