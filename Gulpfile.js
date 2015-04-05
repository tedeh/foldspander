'use strict'

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');

gulp.task('compile', function() {

  var browser = browserify({
    entries: [__dirname]
  });

  browser.exclude('lodash');

  return browser.bundle()
    .pipe(source('foldspander.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .on('error', util.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));

});

gulp.task('uglify', function() {

  return gulp.src('./dist/foldspander.js')
    .pipe(uglify())
    .on('error', util.log)
    .pipe(rename(function(path) {
      path.basename = path.basename + '.min';
    }))
    .pipe(gulp.dest('./dist'));

});

gulp.task('default', ['compile', 'uglify']);
