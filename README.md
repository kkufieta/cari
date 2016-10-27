#Content Aware Resizing of Images (CARI)

CARI is a seam carving algorithm based on [this paper](http://graphics.cs.cmu.edu/courses/15-463/2007_fall/hw/proj2/imret.pdf), implemented in the browser.

It uses the shortest path algorithm to find rows and columns in the image that contain least information (expressed in the form of "energy").
Those rows / columns are deleted first when the image is downsized.

## About
This is an experimental implementation of the algorithm in the browser. It is a work in progress.
Test the application in the [Demo](http://katharinaxeniakufieta.github.io/cari/).

## Dependencies
No dependencies yet. Will be introduced once I add TypeScript.

### CSS Framework
The CSS Framework used in this project is [MaterialzeCSS](http://materializecss.com/).

### JavaScript
Future versions will use [TypeScript](https://www.typescriptlang.org/index.html). For now it is still pure JavaScript.

## Author
The code is written by [Katharina Kufieta](https://www.linkedin.com/in/katharinakufieta).

## In-between steps during the development
I started developing this program before I knew how to use design patterns, what MVVM is and how to use Knockout.js. Once I learned all that, I needed to refactor the code and incorporate Knockout.js, before I continued adding more features. In order to understand how to use Knockout and the HTML5 Canvas, I developed this small example on JSFiddle: https://jsfiddle.net/katharinaxeniakufieta/ateos0x2/

## TO DO
So far, the user does:
1) Choose and upload a picture
2) Define how much to reduce the picture in width (only the input of '1' works as of yet, because the energy around the seam is not recalculated and 
3) Press "Start Resizing"

Given that all inputs were correct, the program then calculates the first seam and displays the energy picture, and pictures with the seam. The resizing does not work yet, because the seam does not get deleted yet, nor is the energy around the seam re-calculated after removing that seam.

The list of To-Dos is as follows:
1) Re-factor the program into MVVM using Knockout.js before adding features.
2) Add feature: Picture is automatically compressed by program prior to seam calculation (might be necessary in order to get feasible waiting times).
3) Add feature: Width and height reduction possible (so far only width reduction is implemented)
4) Add dragging as a way to resize picture (not only adding number of pixels you want to resize it).
5) Precalculate 3 versions on how to resize picture: Width, height and diagonally (which could be width & height alternating). Allow the user to decide the direction by dragging the original picture.
6) Add a % bar to show progress of (pre-) calculations, calculate estimated time until finished and show to the user.
7) Give option to download resized picture, or even download all pictures (e.g. including seams and energy picture) in a zip file.