/* There are two ways one can implement seam carving in the browser:
   1. Precalculate seams in vertical, horizontal and diagonal direction. Allow
   the user to resize in only those directions. Would work very fast,
   but it would restrict the user to go either vertically, horizontally or
   diagonally. If the user would then decide to change direction of
   resizing, this algorithm would have to precalculate all options once more.
   2. The naive solution: Keep the original image, and whatever the user decides
   he/she wants to resize: Run seam carving from the original image
   to achieve that resized image.
   One way to optimize this would be to precalculate e.g. 25%, 50% and 75%
   sizes of the images, and go from these images depending on where the user
   starts from.
*/

/**********************************************
 * Seamcarver class: Take data from uploaded picture,
 * create Imagegraph, run seamcarving on it
 *********************************************/
var Seamcarver = function(canvas) {
  // Create imagegraph from the image in the canvas
  this.originalImage = new Imagegraph();
  this.originalImage.constructFromCanvas(canvas);
  // Will be copied from originalImage every time resizeWidth is called
  this.resizedImage = new Imagegraph();

  // Array saving the seams
  this.seams = [];
}

Seamcarver.prototype.resizeWidth = function(numberVerticalSeams) {
  this.seams = [];
  this.resizedImage.copy(this.originalImage);
  for (var seam = 0; seam < numberVerticalSeams; seam++) {
    var verticalMinPath = this.getVerticalMinPath();
    console.log("verticalMinPath: " + verticalMinPath);
    // Array saving the seams
    this.seams.push(verticalMinPath);
    console.log(this.seams);
    this.removeVerticalPath(verticalMinPath);
    this.recalculateVerticalEnergy(verticalMinPath);
    this.resizedImage.resetPixelArray();
  }
}

/*
 * Find vertical seam
 */
Seamcarver.prototype.getVerticalMinPath = function() {
  var newPixel = {};
  // queue of pixels that need to be processed to find the
  // shortest path
  var queue = new Array();
  var currentPixel = {};
  // minimum Distance that will help to find the shortest
  // path
  var minDist = Number.POSITIVE_INFINITY;
  // hold on to the last pixel that belongs to the minimum path
  var minEndPixel = -1;
  // Array of indices of the minimum path
  minPath = new Array();

  // Add the top row of pixels to the queue
  for (var i = 0; i < this.resizedImage.width; i++) {
    queue.unshift(this.resizedImage.pixelArray[i]);
    this.resizedImage.pixelArray[i].marked = true;
    this.resizedImage.pixelArray[i].cost = this.resizedImage.pixelArray[i].energy;
  }
  while (queue[0] != null) {
    currentPixel = queue.pop();
    if (currentPixel.row < this.resizedImage.height - 1) {
      var row = currentPixel.row + 1;
      for (var col = currentPixel.col - 1; col <= currentPixel.col + 1; col++) {
        if (col >= 0 && col < this.resizedImage.width) {
          newPixel = this.resizedImage.pixelArray[this.resizedImage.getIndex(col, row)];
          if (!newPixel.marked) {
            newPixel.cost = currentPixel.cost + newPixel.energy;
            newPixel.prior = currentPixel;
            newPixel.marked = true;
            queue.unshift(newPixel);
          } else if (newPixel.cost > currentPixel.cost + newPixel.energy) {
            var index = queue.indexOf(newPixel);
            newPixel.cost = currentPixel.cost + newPixel.energy;
            newPixel.prior = currentPixel;
            queue[index] = newPixel;
          } else {
            // "Pixel is already in queue and the new cost is not lower");
          }
        }
      }
    } else {
      if (currentPixel.cost < minDist) {
        minDist = currentPixel.cost;
        minEndPixel = currentPixel;
      }
    }
  }
  console.log("MinEndPixel is found and has cost " + minEndPixel.cost);
  var counter = 0;
  while (minEndPixel != null) {
    counter++;
    minPath.unshift(minEndPixel.col);
    minEndPixel = minEndPixel.prior;
  }
  this.printPath(minPath);
  return minPath;
};

/*
 * Remove the path from the minimized picture
 */
Seamcarver.prototype.removeVerticalPath = function(path) {
  if (path === undefined) {
    console.log('no path');
  }
  var adjustIndex = 0;
  var index, startIndex;
  for (var row = 0; row < this.resizedImage.height; row++) {
    for (var col = 0; col < this.resizedImage.width; col++) {
      if (path[row] === col) {
        adjustIndex++;
      }
      index = this.resizedImage.getIndex(col, row);
      this.resizedImage.pixelArray[index] = this.resizedImage.pixelArray[index + adjustIndex];

      var data = this.resizedImage.imageData.data;
      startIndex = row * this.resizedImage.width * 4 + col * 4;
      data[startIndex] = data[startIndex + adjustIndex * 4];
      data[startIndex + 1] = data[startIndex + 1 + adjustIndex * 4];
      data[startIndex + 2] = data[startIndex + 2 + adjustIndex * 4];
      data[startIndex + 3] = 255; // alpha
    }
  }
  console.log(this.resizedImage.pixelArray.length);
  console.log(this.resizedImage.imageData.data.length);
  console.log(this.resizedImage.width);
  console.log(this.resizedImage.height);
  for (var i = 0; i < path.length; i++) {
    this.resizedImage.pixelArray.pop();
  }
  this.resizedImage.width--;
  this.resizedImage.imageData = new ImageData(data.slice(0, -adjustIndex * 4), this.resizedImage.width, this.resizedImage.height);
  console.log(this.resizedImage.pixelArray.length);
  console.log(this.resizedImage.imageData.data.length);
  console.log(this.resizedImage.width);
  console.log(this.resizedImage.height);
};

// the columns given by the path could be outside the picture. that's
// because the energy is recalculated after the image has been resized,
// and the seam could have been on the outer edge of the picture, which
// would be out of bounds in the new, smaller version of the image.
Seamcarver.prototype.recalculateVerticalEnergy = function(path) {
  var col;
  for (var row = 0; row < this.resizedImage.height; row++) {
    col = path[row];
    // adjust the column to be within the bounds of the new, resized image.
    if (col >= this.resizedImage.width) {
      col = this.resizedImage.width - 1;
    }
    if (col > 0) {
      this.resizedImage.calculateEnergy(col - 1, row);
    }
    if (col < this.resizedImage.width - 1) {
      this.resizedImage.calculateEnergy(col + 1, row);
    }
    this.resizedImage.calculateEnergy(col, row);
  }
};

/*
 * create picture where the seams are highlighted in red.
 */
Seamcarver.prototype.addSeamsToPicture = function(imagedata, width, height) {
  var pathPicture = new ImageData(imagedata.data, width, height);
  var data = pathPicture.data;
  // add seams to picture, in red color
  for (var i = 0, max = this.seams.length; i < max; i++) {
    // add each path to data, make it red
    for (var row = 0; row < height; row++) {
      var col = this.seams[i][row];
      var startIndex = row * width * 4 + col * 4;
      data[startIndex] = 255;
      data[startIndex + 1] = 0;
      data[startIndex + 2] = 0;
      data[startIndex + 3] = 255; // alpha
    }
  }
  return pathPicture;
};


Seamcarver.prototype.pathPicture = function() {
  console.log(this.originalImage.imageData.data.length);
  console.log(this.originalImage.width);
  console.log(this.originalImage.height);
  return this.addSeamsToPicture(this.originalImage.imageData, this.originalImage.width, this.originalImage.height);
};

Seamcarver.prototype.energyPathPicture = function() {
  var energyPicture = this.originalImage.energyPicture();
  return this.addSeamsToPicture(energyPicture, this.originalImage.width, this.originalImage.height);
};

Seamcarver.prototype.resizedPicture = function() {
  return this.resizedImage.picture();
};

Seamcarver.prototype.resizedEnergyPicture = function() {
  return this.resizedImage.energyPicture();
};

Seamcarver.prototype.calculateVerticalSeams = function() {
  // precalculate vertical seams from max width to width 1 of image
};

Seamcarver.prototype.calculateHorizontalSeams = function() {
  // precalculate horizontal seams from max width to width 1 of image
};

Seamcarver.prototype.calculateVerticalSeams = function() {
  // precalculate vertical seams (change between horizontal & vertical)
  // from width & height 1 to either width or height 1 (depending
  // on which one is smaller, it will reach width / height of 1 faster)
};

// Print the path in the console
Seamcarver.prototype.printPath = function(minPath) {
  console.log("-------------------- Vertical seam : --------------------");
  var stringPath = "Vertical seam : { ";
  for (var i = 0; i < minPath.length; i++) {
    stringPath += minPath[i] + " ";
  }
  stringPath += "}";
  console.log(stringPath);
  stringPath = "";
  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.width; col++) {
      if (col === minPath[row]) {
        stringPath += this.getEnergy(col, row).toFixed(2) + "* ";
      } else {
        stringPath += this.getEnergy(col, row).toFixed(2) + "  ";
      }
    }
    console.log(stringPath);
    stringPath = "";
  }
  console.log("---------------------------------------------------------");
}