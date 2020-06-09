var prev_theta;
var prev_phi;
var prev_rho;

$("*").keydown(function(e) {
  if (!camera.focusedOn) {
    camera.focusOn(SGE.ORIGIN);
  } else {
    SGE.focus_point = camera.focusedOn;
  }
  prev_theta = camera.theta;
  prev_phi = camera.phi;
  prev_rho = camera.rho;
  if (e.which===39) {
    camera.theta -= Math.PI/100;
    prev_theta = camera.theta;
  } else if (e.which===37) {
    camera.theta += Math.PI/100;
  } else if (e.which===38) {
    camera.phi -= Math.PI/100;
  } else if (e.which===40) {
    camera.phi += Math.PI/100;
  } else if (e.which===73) {
    camera.rho -= .1;
  } else if (e.which===79) {
    camera.rho += .1;
  } else if (e.which===87) {
    SGE.focus_point.y += .1;
    camera.focusOn(SGE.focus_point);
    camera.phi = prev_phi;
    camera.rho = prev_rho;
  } else if (e.which===65) {
    SGE.focus_point.x -= .1;
    camera.focusOn(SGE.focus_point);
    camera.theta = prev_theta;
    camera.rho = prev_rho;
  } else if (e.which===83) {
    SGE.focus_point.y -= .1;
    camera.focusOn(SGE.focus_point);
    camera.phi = prev_phi;
    camera.rho = prev_rho;
  } else if (e.which===68) {
    SGE.focus_point.x += .1;
    camera.focusOn(SGE.focus_point);
    camera.theta = prev_theta;
    camera.rho = prev_rho;
  }
});

var n_images = 0;
var t = 300;
var start = 0;
var end = 19;
var skip = end+1;
var delay = 0;
var images;

btGo.div.onclick = function() {
  setTimeout(function() {
    var i = 0;
    images = [];
    var interval = setInterval(function () {
      if (i < n_images) {
        //images.push(viewport.canvas3d.toDataURL("png"));
        images.push(textures());
      } else {
        clearInterval(interval);
      }
      i++;
    }, t);
  }, delay);
}

btNext.div.onclick = function() {
  setTimeout(function() {
    var i = 0;
    images = [];
    var interval = setInterval(function () {
      if (i < n_images) {
        //images.push(viewport.canvas3d.toDataURL("png"));
        images.push(textures());
      } else {
        clearInterval(interval);
      }
      i++;
    }, t);
  }, delay);
}


function textures() {
  var renderer = viewport.__renderer;
  // Create the texture that will store our result
  this.depth_texture = new THREE.DepthTexture(viewport.width, viewport.height);
  var rt = new THREE.WebGLRenderTarget( viewport.width, viewport.height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
  rt.depthTexture = depth_texture;



  renderer.render(viewport.__scene, viewport.__camera, rt);
  return {image: renderer.properties.get(rt.texture).__webglTexture, depth: renderer.properties.get(rt.depthTexture).__webglTexture};
}



function draw_frames() {
  stop = 1;
  this.gl = viewport.__renderer.context;

  var vs_source =
  `
  precision highp float;
  attribute vec2 vert_pos;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;
  void main() {
    v_texcoord = a_texcoord;
    gl_Position = vec4(vec2(1, -1)*vert_pos, 0, 1);
  }
  `
  var fs_source =
  `
  precision highp float;
  varying vec2 v_texcoord;
  uniform sampler2D image1;
  uniform sampler2D image2;
  uniform sampler2D depth1;
  uniform sampler2D depth2;
  vec3 gray(vec4 col) {
    return vec3((col.r+col.g+col.b)/3.0);
  }
  void main() {
    vec4 pixel1 = texture2D(image1, v_texcoord);
    vec4 pixel2 = texture2D(image2, v_texcoord);
    vec4 depth1 = texture2D(depth1, v_texcoord);
    vec4 depth2 = texture2D(depth2, v_texcoord);
    if (pixel1.rgb==vec3(1, 1, 1)) {
      gl_FragColor = pixel2;
    } else if (pixel2.rgb==vec3(1, 1, 1)) {
      gl_FragColor = pixel1;
    } else if (depth1.r<depth2.r-0.001) {
      gl_FragColor = pixel1;
    } else {
      gl_FragColor = pixel2;
    }
  }
  `
  var fs2_source =
  `
  precision highp float;
  varying vec2 v_texcoord;
  uniform sampler2D image1;
  uniform sampler2D image2;
  uniform sampler2D depth1;
  uniform sampler2D depth2;
  vec3 gray(vec4 col) {
    return vec3((col.r+col.g+col.b)/3.0);
  }
  void main() {
    vec4 pixel1 = texture2D(image1, v_texcoord);
    vec4 pixel2 = texture2D(image2, v_texcoord);
    vec4 depth1 = texture2D(depth1, v_texcoord);
    vec4 depth2 = texture2D(depth2, v_texcoord);
    if (pixel1.rgb==vec3(1, 1, 1)) {
      gl_FragColor = depth2;
    } else if (pixel2.rgb==vec3(1, 1, 1)) {
      gl_FragColor = depth1;
    } else if (depth1.r<depth2.r-0.001) {
      gl_FragColor = depth1;
    } else {
      gl_FragColor = depth2;
    }
  }
  `
  var prgm = gl.createProgram();
  var vs = gl.createShader(gl.VERTEX_SHADER);
  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vs, vs_source);
  gl.shaderSource(fs, fs_source);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(prgm, vs);
  gl.attachShader(prgm, fs);
  gl.linkProgram(prgm);

  var prgm2 = gl.createProgram();
  vs = gl.createShader(gl.VERTEX_SHADER);
  fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vs, vs_source);
  gl.shaderSource(fs, fs2_source);
  gl.compileShader(vs);
  gl.compileShader(fs);
  gl.attachShader(prgm2, vs);
  gl.attachShader(prgm2, fs);
  gl.linkProgram(prgm2);


  gl.useProgram(prgm);
  gl.uniform1i(gl.getUniformLocation(prgm, "image1"), 0);
  gl.uniform1i(gl.getUniformLocation(prgm, "image2"), 1);
  gl.uniform1i(gl.getUniformLocation(prgm, "depth1"), 2);
  gl.uniform1i(gl.getUniformLocation(prgm, "depth2"), 3);

  gl.useProgram(prgm2);
  gl.uniform1i(gl.getUniformLocation(prgm2, "image1"), 0);
  gl.uniform1i(gl.getUniformLocation(prgm2, "image2"), 1);
  gl.uniform1i(gl.getUniformLocation(prgm2, "depth1"), 2);
  gl.uniform1i(gl.getUniformLocation(prgm2, "depth2"), 3);

  var vertices = new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, 1
  ]);
  var t_vertices = new Float32Array([
    0, 1,
    0, 0,
    1, 1,
    1, 0
  ]);

  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  var pal = gl.getAttribLocation(prgm2, 'vert_pos');
  gl.vertexAttribPointer(
    pal,
    2,
    gl.FLOAT,
    gl.FALSE,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(pal);
  var tbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
  var tal = gl.getAttribLocation(prgm2, 'a_texcoord');
  gl.vertexAttribPointer(
    tal,
    2,
    gl.FLOAT,
    gl.FALSE,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl.bufferData(gl.ARRAY_BUFFER, t_vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(tal);

  gl.useProgram(prgm);
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  var pal = gl.getAttribLocation(prgm, 'vert_pos');
  gl.vertexAttribPointer(
    pal,
    2,
    gl.FLOAT,
    gl.FALSE,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(pal);
  var tbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tbo);
  var tal = gl.getAttribLocation(prgm, 'a_texcoord');
  gl.vertexAttribPointer(
    tal,
    2,
    gl.FLOAT,
    gl.FALSE,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl.bufferData(gl.ARRAY_BUFFER, t_vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(tal);

  var fb = gl.createFramebuffer();

  function data_texture(tex, data, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  var tex_in = gl.createTexture();
  data_texture(tex_in, null, viewport.width, viewport.height);
  var tex_out = gl.createTexture();
  data_texture(tex_out, null, viewport.width, viewport.height);

  var depth_in = gl.createTexture();
  data_texture(depth_in, null, viewport.width, viewport.height);
  var depth_out = gl.createTexture();
  data_texture(depth_out, null, viewport.width, viewport.height);




  gl.useProgram(prgm2);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, images[start].image);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, images[start+1].image);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, images[start].depth);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, images[start+1].depth);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, depth_out);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depth_out, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.useProgram(prgm);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, images[start].image);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, images[start+1].image);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, images[start].depth);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, images[start+1].depth);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, tex_out);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex_out, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  if (end-start===1) {
    this.buffer = new Uint8Array(viewport.width*viewport.height*4);
    gl.readPixels(0, 0, viewport.width, viewport.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    draw_final();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  } else {
    for (var i = start+1; i < end; i++) {
      if (i !== skip) {
        tex_in = tex_out;
        var tex_out = gl.createTexture();
        data_texture(tex_out, null, viewport.width, viewport.height);

        depth_in = depth_out;
        var depth_out = gl.createTexture();
        data_texture(depth_out, null, viewport.width, viewport.height);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex_in);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, images[i+1].image);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, depth_in);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, images[i+1].depth);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, depth_out);

        gl.useProgram(prgm2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depth_out, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.useProgram(prgm);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, tex_out);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex_out, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (i===end-1) {
          this.buffer = new Uint8Array(viewport.width*viewport.height*4);
          gl.readPixels(0, 0, viewport.width, viewport.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
          draw_final();
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
      }
    }
  }
}

var c = document.createElement("canvas");
c.width = viewport.width;
c.height = viewport.height;
document.body.appendChild(c);
var gl2 = c.getContext("webgl");

function draw_final() {
  var vs_source =
  `
  precision highp float;
  attribute vec2 vert_pos;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;
  void main() {
    v_texcoord = vec2(a_texcoord.x, 1.0-a_texcoord.y);
    gl_Position = vec4(vert_pos, 0, 1);
  }
  `
  var fs_source =
  `
  precision highp float;
  varying vec2 v_texcoord;
  uniform sampler2D image;
  vec4 gray(vec4 col) {
    return vec4(vec3(col.r+col.g+col.b)/3.0, 1);
  }
  void main() {
    gl_FragColor = gray(texture2D(image, v_texcoord));
  }
  `

  var vs = gl2.createShader(gl2.VERTEX_SHADER);
  var fs = gl2.createShader(gl2.FRAGMENT_SHADER);
  var prgm = gl2.createProgram();
  gl2.shaderSource(vs, vs_source);
  gl2.shaderSource(fs, fs_source);
  gl2.compileShader(vs);
  gl2.compileShader(fs);
  gl2.attachShader(prgm, vs);
  gl2.attachShader(prgm, fs);
  gl2.linkProgram(prgm);
  gl2.useProgram(prgm);

  var vertices = new Float32Array([
    -1, -1,
    -1, 1,
    1, -1,
    1, 1
  ]);
  var t_vertices = new Float32Array([
    0, 1,
    0, 0,
    1, 1,
    1, 0
  ]);

  var vbo = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, vbo);
  var pal = gl2.getAttribLocation(prgm, 'vert_pos');
  gl2.vertexAttribPointer(
    pal,
    2,
    gl2.FLOAT,
    false,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl2.bufferData(gl2.ARRAY_BUFFER, vertices, gl2.STATIC_DRAW);
  gl2.enableVertexAttribArray(pal);
  var tbo = gl2.createBuffer();
  gl2.bindBuffer(gl2.ARRAY_BUFFER, tbo);
  var tal = gl2.getAttribLocation(prgm, 'a_texcoord');
  gl2.vertexAttribPointer(
    tal,
    2,
    gl2.FLOAT,
    false,
    2*Float32Array.BYTES_PER_ELEMENT,  // Size of individual vertex
    0  // Offset
  );
  gl2.bufferData(gl2.ARRAY_BUFFER, t_vertices, gl2.STATIC_DRAW);
  gl2.enableVertexAttribArray(tal);

  var tex = gl2.createTexture();
  gl2.bindTexture(gl2.TEXTURE_2D, tex);
  gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, viewport.width, viewport.height, 0, gl2.RGBA, gl2.UNSIGNED_BYTE, buffer);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.NEAREST);
  gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.NEAREST);

  gl2.activeTexture(gl2.TEXTURE0);
  gl2.bindTexture(gl2.TEXTURE_2D, tex);

  gl2.drawArrays(gl2.TRIANGLE_STRIP, 0, 4);
}
