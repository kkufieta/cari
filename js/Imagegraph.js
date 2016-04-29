/**********************************************
 * Custom Image Class
 *********************************************/

var Imagegraph = function(image, ctx) {
  // ImageData: Reading and writing a data
  // array to manipulate pixel data.
  console.log("image width, height: " + image.width + ", " + image.height);
  this.ctx = ctx;
  this.imageData = this.ctx.getImageData(0, 0, image.width, image.height);
  this.width = this.imageData.width;
  this.height = this.imageData.height;
  // ImageData.data : Uint8ClampedArray represents a 1-dim array
  // containing the data in the RGBA order, with integer values
  // between 0 and 255 (included).
  this.pixels = [];
  this.setPixelArray();
}

Imagegraph.prototype.setPixelArray = function() {
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      this.pixels.push(this.getPixel(col, row));
    }
  }
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      var energy = this.calculateEnergy(col, row);
      this.pixels[this.getIndex(col, row)].setEnergy(energy);
    }
  }
}

Imagegraph.prototype.getPixel = function(col, row) {
  var startIndex = row * this.width * 4 + col * 4;
  var red = this.imageData.data[startIndex],
      green = this.imageData.data[startIndex + 1],
      blue = this.imageData.data[startIndex + 2],
      alpha = this.imageData.data[startIndex + 3];
  return new Pixel(col, row, new Color(red, green, blue, alpha));
}

Imagegraph.prototype.calculateEnergy = function(col, row) {
  if (col === 0 || row === 0 || col === this.width - 1||
      row === this.height -1) {
    return 1000;
  }
  var pixelAbove = this.pixels[this.getIndex(col, row - 1)],
      pixelBelow = this.pixels[this.getIndex(col, row + 1)],
      pixelLeft = this.pixels[this.getIndex(col - 1, row)],
      pixelRight = this.pixels[this.getIndex(col + 1, row)];

  var redX = pixelRight.color.red - pixelLeft.color.red,
      greenX = pixelRight.color.green - pixelLeft.color.green,
      blueX = pixelRight.color.blue - pixelLeft.color.blue;
  var redY = pixelBelow.color.red - pixelAbove.color.red,
      greenY = pixelBelow.color.green - pixelAbove.color.green,
      blueY = pixelBelow.color.blue - pixelAbove.color.blue;
  var xGradientSquared = redX * redX + greenX * greenX + blueX * blueX,
      yGradientSquared = redY * redY + greenY * greenY + blueY * blueY;
  var energy = Math.sqrt(xGradientSquared + yGradientSquared);

  return energy;
}

Imagegraph.prototype.getIndex = function(col, row) {
  return row * this.width + col;
}

Imagegraph.prototype.getEnergy = function(col, row) {
  return this.pixels[this.getIndex(col, row)].energy;
}

Imagegraph.prototype.energyPicture = function() {
  var energyPicture = this.ctx.createImageData(this.imageData);
  var data = energyPicture.data;
  for (var col = 0; col < this.width; col++){
    for (var row = 0; row < this.height; row++) {
      var energy = this.getEnergy(col, row);
      energy = Math.floor(energy / 1000 * 255);
      var startIndex = row * this.width * 4 + col * 4;
      data[startIndex] = energy;
      data[startIndex + 1] = energy;
      data[startIndex + 2] = energy;
      data[startIndex + 3] = 255; // alpha
    }
  }
  return energyPicture;
}
