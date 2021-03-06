/**********************************************
 * Imagegraph class: Get data from uploaded picture,
 * create graph, run seamcarver on it
 *********************************************/
/**
 * Saves image information in form of Pixels and imagedata.
 * @constructor
 */
var Imagegraph = function() {
  this.context = {};
  this.imageData = {};
  this.width = {};
  this.height = {};
  this.pixelArray = [];
}

/***********************************************
 * Methods to construct Imagegraph from a canvas
 **********************************************/
/**
 * Constructor: construct Imagegraph from a canvas.
 * @param {object} canvas - The canvas that holds the image that we'll read from.
 */
Imagegraph.prototype.constructFromCanvas = function(canvas) {
  this.context = canvas.context;
  this.imageData = this.context.getImageData(0, 0, canvas.canvasWidth(), canvas.canvasHeight());
  this.width = this.imageData.width;
  this.height = this.imageData.height;
  // ImageData.data : Uint8ClampedArray represents a 1-dim array
  // containing the data in the RGBA order, with integer values
  // between 0 and 255 (included).
  this.pixelArray = [];
  // populate the pixels array with the pixels from the image that is saved in
  // the canvas
  this.setPixelArray();
};

/**
 * Creates a Pixel object for every pixel in picture, calculate
 * its energy and save it in an array. All pixels have an energy, a pointer to
 * the pixel above it and the distance traveled when searching for
 * paths.
 */
Imagegraph.prototype.setPixelArray = function() {
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      this.pixelArray.push(this.getPixel(col, row));
    }
  }
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      var energy = this.calculateEnergy(col, row);
      this.pixelArray[this.getIndex(col, row)].setEnergy(energy);
    }
  }
  // For debugging purposes, print the array:
  // this.printPixelArray();
};

/**
 * Resets the Pixel array, so it can be used for a new calculation of the next
 * seam.
 */
Imagegraph.prototype.resetPixelArray = function() {
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      this.pixelArray[this.getIndex(col, row)].reset(col, row);
    }
  }
};

/**
 * Resets the seams in the Pixel array, so it can be used to save new seams.
 */
Imagegraph.prototype.resetSeams = function() {
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      this.pixelArray[this.getIndex(col, row)].resetSeams(col, row);
    }
  }
};

/***********************************************
 * Methods to construct Imagegraph from another
 * Imagegraph
 **********************************************/
/**
 * Constructor: Create this Imagegraph from another Imagegraph.
 * @param {object} imagegraph - The imagegraph we're copying from.
 */
Imagegraph.prototype.copy = function(imagegraph) {
  // this.context = {};
  this.width = imagegraph.width;
  this.height = imagegraph.height;
  // clear the pixelArray in case it was populated from before
  this.pixelArray = [];
  var dataCopy = new Uint8ClampedArray(imagegraph.imageData.data);
  this.imageData = new ImageData(dataCopy, this.width, this.height);
  for (var i = 0, max = imagegraph.pixelArray.length; i < max; i++) {
    this.pixelArray[i] = new Pixel();
    this.pixelArray[i].copy(imagegraph.pixelArray[i]);
  }
};

/**
 * Copy and return a pixelarray.
 * @returns {object} Copy of the pixelArray.
 */
Imagegraph.prototype.copyPixelArray = function() {
  var newPixelArray = [];
  for (var i = 0, max = this.pixelArray.length; i < max; i++) {
    newPixelArray[i] = new Pixel();
    newPixelArray[i].copy(this.pixelArray[i]);
  }
  return newPixelArray;
}

/******************
 * General Methods
 *****************/
/**
 * Calculate the energy of a Pixel at the given row & col. The energy of that
 * Pixel is dependent on the color of the Pixels surrounding it.
 * @param {number} col - The column where the pixel is located.
 * @param {number} row - The row where the pixel is located.
 */
Imagegraph.prototype.calculateEnergy = function(col, row) {
  if (this.pixelArray.length > 0) {
    if (col === 0 || row === 0 || col === this.width - 1 ||
        row === this.height - 1) {
      return 1000;
    }
    var pixelAbove = this.pixelArray[this.getIndex(col, row - 1)],
        pixelBelow = this.pixelArray[this.getIndex(col, row + 1)],
        pixelLeft = this.pixelArray[this.getIndex(col - 1, row)],
        pixelRight = this.pixelArray[this.getIndex(col + 1, row)];

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
  } else {
    throw new EmptyPixelArrayException();
  }
};

/**
 * Return the index of a Pixel for the given row and column.
 * @param {number} col - The column where the pixel is located.
 * @param {number} row - The row where the pixel is located.
 * @returns {number} Index of the Pixel in its array.
 */
Imagegraph.prototype.getIndex = function(col, row) {
  return row * this.width + col;
};

/**
 * Return the energy of the Pixel at the given row and column.
 * @param {number} col - The column where the pixel is located.
 * @param {number} row - The row where the pixel is located.
 * @returns {number} Energy of the Pixel.
 */
Imagegraph.prototype.getEnergy = function(col, row) {
  if (this.pixelArray.length > 0) {
    return this.pixelArray[this.getIndex(col, row)].energy;
  } else {
    throw new EmptyPixelArrayException();
  }
}

/**
 * Create the energy picture by calculating the energy of each
 * each pixel from the original picture. It skips over the
 * creation of the pixel array which makes it faster.
 * @returns {Uint8ClampedArray} Array holding the energies picture of the image.
 */
Imagegraph.prototype.energyPicture = function() {
  var dataCopy = new Uint8ClampedArray(this.imageData.data);
  var energyPicture = new ImageData(dataCopy, this.width, this.height);
  var data = energyPicture.data;
  var maxVal = 0;
  var stringEnergy = "";
  // console.log("-------------------- Energy of the picture : --------------------");
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      var energy = this.getEnergy(col, row);
      if (col == this.width - 1) {
        stringEnergy += energy.toFixed(2);
      } else {
        stringEnergy += energy.toFixed(2) + ", ";
      }
      if (row !== 0 && col !== 0 && row !== this.height - 1 && col !== this.width - 1) {
        if (energy > maxVal) {
          maxVal = energy;
        }
      }
      energy = Math.floor(energy / 1000 * 255);
      var startIndex = row * this.width * 4 + col * 4;
      data[startIndex] = energy;
      data[startIndex + 1] = energy;
      data[startIndex + 2] = energy;
      data[startIndex + 3] = 255; // alpha
    }
    // console.log(stringEnergy);
    // stringEnergy = "";
  }
  // console.log("-----------------------------------------------------------------");
  // if the picture is black, return it
  if (maxVal === 0) {
    return energyPicture;
  }
  console.log("maxVal: " + maxVal);
  // normalize picture
  for (var row = 1; row < this.height - 1; row++) {
    for (var col = 1; col < this.width - 1; col++) {
      var energy = this.getEnergy(col, row);
      energy = Math.floor(energy / maxVal * 255);
      var startIndex = row * this.width * 4 + col * 4;
      data[startIndex] = energy;
      data[startIndex + 1] = energy;
      data[startIndex + 2] = energy;
      data[startIndex + 3] = 255; // alpha
    }
  }

  // console.log('====== Energy Picture ======');
  // console.log('imageData length: ' + energyPicture.data.length);
  // console.log('width: ' + this.width);
  // console.log('height: ' + this.height);
  // console.log('imageData: ');
  // printUint8(energyPicture.data, this.width, this.height);

  return energyPicture;
}

/**
 * create a copy of the imagedata and return the picture for further manipulation.
 * @returns {uint8clampedarray} array holding the picture data of the image.
 */
Imagegraph.prototype.picture = function() {
  // console.log('====== Picture ======');
  // console.log('imageData length: ' + this.imageData.data.length);
  // console.log('width: ' + this.width);
  // console.log('height: ' + this.height);
  // console.log('imageData: ');
  // printUint8(this.imageData.data, this.width, this.height);
  var dataCopy = new Uint8ClampedArray(this.imageData.data);
  var picture = new ImageData(dataCopy, this.width, this.height);
  return picture;
}

/**
 * Return the pixel at the specified column and row.
 * @param {number} col - The column where the pixel is located.
 * @param {number} row - The row where the pixel is located.
 * @returns {object} Pixel at given row and column.
 */
Imagegraph.prototype.getPixel = function(col, row) {
  var startIndex = row * this.width * 4 + col * 4;
  var red = this.imageData.data[startIndex],
      green = this.imageData.data[startIndex + 1],
      blue = this.imageData.data[startIndex + 2],
      alpha = this.imageData.data[startIndex + 3];
  return new Pixel(col, row, new Color(red, green, blue, alpha));
};

/**
 * For debugging purposes: Print pixels of the image (RGB values)
 */
Imagegraph.prototype.printPixelArray = function() {
  if (this.pixelArray === undefined) {
    console.log('pixelArray is undefined ,can not print its values');
  } else {
    var stringPixels = "";
    console.log("-------------------- Energy of the picture : ---------------");
    for (var row = 0; row < this.height; row++) {
      for (var col = 0; col < this.width; col++) {
        if (col == this.width - 1) {
          stringPixels += this.getPixel(col, row).toString();
        } else {
          stringPixels += this.getPixel(col, row).toString() + ", ";
        }
      }
      console.log(stringPixels);
      stringPixels = "";
    }
    console.log("------------------------------------------------------------");
  }
};

/**************
 * Exceptions *
 **************/
function EmptyPixelArrayException() {
  this.message = "PixelArray is empty";
};

function EmptyObjectException() {
  this.message = "Object is empty";
};
