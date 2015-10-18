var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('default', function() {
  console.log('OK');
});

gulp.task('sass', function () {
  gulp.src('./styles/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public_html/css'));
});