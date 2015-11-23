const gulp = require('gulp');
const	concat = require('gulp-concat');
const	sass = require('gulp-sass');
const	minifycss = require('gulp-minify-css');
const bourbon = require('node-bourbon');
const electron = require('electron-connect').server.create();
const babel = require('gulp-babel');

var source = {
	styles		: 'src/css',
	scripts   : 'src/js',
	images		: 'src/images'
};

var destination = {
	styles		: 'build/css',
	scripts   : 'build/js',
	images		: 'build/images'
};

gulp.task('default', ['scripts', 'styles', 'images', 'run', 'watch']);

gulp.task('scripts', function () {
	return gulp.src(source.scripts + '/*.js*')
        .pipe(babel({
            presets: ['react']
        }))
				.pipe(gulp.dest(destination.scripts));
});

gulp.task('styles', function () {
	return gulp.src(source.styles + '/*.scss')
		.pipe(sass({includePaths: bourbon.with(source.styles)}))
		.pipe(concat('style.css'))
		.pipe(minifycss())
		.pipe(gulp.dest(destination.styles));
});

gulp.task('images', function () {
	return gulp.src(source.images + '/**/*')
		.pipe(gulp.dest(destination.images));
});

gulp.task('run', function () {
	electron.start();
});

gulp.task('watch', ['scripts', 'styles'], function () {
	gulp.watch([source.scripts + '/**/*.js*'], ['scripts']);
	gulp.watch(source.styles + '/**/*.scss', ['styles']);

	//Reloading when compiled
	gulp.watch([destination.styles + '/**/*.css', destination.scripts + '/**/*.js*'], electron.reload);
});
