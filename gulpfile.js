var gulp    = require('gulp'),
    concat  = require('gulp-concat-css'),
    minify  = require('gulp-minify-css');

gulp.task('watch', function () {
  return gulp.watch('contents/css/**/*.css', ['compress']);
});

gulp.task('compress', function () {
  return gulp.src(['contents/css/**/*.css'])
    .pipe(concat('bundle.css'))
    .pipe(minify())
    .pipe(gulp.dest('contents'));
});

gulp.task('default', ['compress', 'watch']);
