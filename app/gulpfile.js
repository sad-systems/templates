/*==============================================================================
 *  Title      : Gulp basic configuration file
 *  Author     : Digger (c) SAD-Systems <http://sad-systems.ru>
 *  Created on : 21.10.2015
 *==============================================================================
 */
//==============================================================================
// Include modules
//==============================================================================

var gulp    = require('gulp');
var sass    = require('gulp-sass');
var less    = require('gulp-less');
var min_js  = require('gulp-uglify');
var min_css = require('gulp-uglifycss');
var concat  = require('gulp-concat');
var rename  = require('gulp-rename');
var gzip    = require('gulp-gzip');
var es      = require('event-stream');

//==============================================================================
// Input params
//==============================================================================

//--- Production build configuration:

var config_production = {
    css: {
        application_css_bundle:
        {
            //src              : 'styles/**/*.css',
            //src_less         : 'styles/**/*.less',
            //src_sass         : 'styles/**/*.scss',
            src_sass         : ['styles/bootstrap.scss', 'styles/main.scss'],
            destination      : 'public_html/css',
            concat_file      : 'public.min.css',
            publish_original : 0,
            publish_minify   : 0,
            publish_concat   : true
        },
        vendor_css_bundle:
        {
            src              : ['vendor/some_vendor/dist/*.css'],
            destination      : 'public_html/css',
            concat_file      : 'vendor.min.css',
            publish_original : 0,
            publish_minify   : 0,
            publish_concat   : true
        }
        
    },
     js: {
        application_js_bundle:
        {
            src              : ['lib/js/**/*.js'],
            destination      : 'public_html/js',
            concat_file      : 'public.min.js',
            publish_original : 0,
            publish_minify   : 0,
            publish_concat   : true            
        },
        vendor_js_bundle:
        {
            src              : [
                                'vendor/bower/jquery/dist/jquery.min.js',
                                'vendor/bower/jquery-ui/jquery-ui.min.js',
                                'vendor/bower/underscore/underscore-min.js',
                                'vendor/bower/backbone/backbone-min.js'
                               ],
            destination      : 'public_html/js',
            concat_file      : 'vendor.min.js',
            publish_original : 0,
            publish_minify   : 0,
            publish_concat   : true            
        },
        vendor_standalone_js:
        {
            src              : [
                                'vendor/bower/bootstrap/dist/js/bootstrap.min.js',
                                'vendor/bower/respond/dest/respond.min.js'
                               ],
            destination      : 'public_html/js',
            concat_file      : '',
            publish_original : true,
            publish_minify   : 0,
            publish_concat   : 0            
        },
        vendor_standalone2_js:
        {
            src              : [
                                'vendor/bower/requirejs/require.js'
                               ],
            destination      : 'public_html/js',
            concat_file      : '',
            publish_original : 0,
            publish_minify   : true,
            publish_concat   : 0            
        }
    }
};

//--- Develope build configuration:

var config_develope = {
    css: {
        application_css_bundle:
        {
            //src              : 'styles/**/*.css',
            //src_less         : 'styles/**/*.less',
            //src_sass         : 'styles/**/*.scss',
            src_sass         : ['styles/bootstrap.scss', 'styles/main.scss'],
            destination      : 'public_html/css',
            concat_file      : '',
            publish_original : true,
            publish_minify   : 0,
            publish_concat   : 0
        }
    },
     js: {
        application_js_bundle:
        {
            src              : [
                                'lib/js/**/*.js',
                                'vendor/bower/jquery/dist/jquery.min.js',
                                'vendor/bower/jquery-ui/jquery-ui.min.js',
                                'vendor/bower/underscore/underscore-min.js',
                                'vendor/bower/backbone/backbone-min.js'
                               ],
            destination      : 'public_html/js',
            concat_file      : '',
            publish_original : true,
            publish_minify   : 0,
            publish_concat   : 0            
        }
    }
};

//==============================================================================
// Tasks
//==============================================================================

//--- Default

gulp.task('default', ['build']);

//--- Build all (production):

gulp.task('build', ['build-css','build-js']);

//--- Build css files (production):

gulp.task('build-css', function () { build(config_production.css, 'css'); });

//--- Build js files (production):

gulp.task('build-js', function () { build(config_production.js, 'js'); });


//--- Build all (develop):

gulp.task('build-dev', ['build-css-dev','build-js-dev']);

//--- Build css files (develop):

gulp.task('build-css-dev', function () { build(config_develope.css, 'css'); });

//--- Build js files (develop):

gulp.task('build-js-dev', function () { build(config_develope.js, 'js'); });

//==============================================================================
// Build functions
//==============================================================================

var build = function (config, type) {
    var builder = buildJs;
    switch (type) {
        case 'css': builder = buildCss;
            break;
        default: type = 'js';   
    }
    for (var bundle_name in config) { 
        console.log('Build ' + type + ' bundle: ' + bundle_name);
        builder(config[bundle_name]);
    }    
};

/**
 * Function to build css files
 * 
 * @param {object} config Configuration object
 */
var buildCss = function (config) {

    config = mergeConfig({
        suffix_min       : '.min',
        publish_original : true,
        publish_minify   : true,
        publish_concat   : true,
        publish_zip      : true
    }, config);

    //--- Compile Less files:
    var compile_less = function (src) {
        console.log('Compile less');
        return gulp.src(src).pipe(less()); 
    };
    
    //--- Compile Sass files:
    var compile_sass = function (src) {
        console.log('Compile sass');
        return gulp.src(src).pipe(sass().on('error', sass.logError));
    };

    //--- Run:
    var run = null; 

    //--- Compile all (and merge css):
    if (config.src_less) {
        run = compile_less(config.src_less);
    }
    if (config.src_sass) {
        if (!run) run = compile_sass(config.src_sass);
        else      run = es.merge(run, compile_sass(config.src_sass));
    }
    if (config.src) {
        console.log('Get plain css');
        if (!run) run = gulp.src(config.src);
        else      run = es.merge(run, gulp.src(config.src));
    }
    
    if (config.publish_original) {
        console.log('Publish css');
        run = run.pipe(gulp.dest(config.destination));
    }

    //--- Minify:
    if (config.publish_minify || config.publish_concat) {
        console.log('Minify css');
        run = run.pipe(min_css())
                 .pipe(rename({suffix: config.suffix_min}));
        if (config.publish_minify) { 
            console.log('Publish minified css with suffix: ' + config.suffix_min);
            run = run.pipe(gulp.dest(config.destination));
        }
    }

    //--- Concatinate:
    if (config.publish_concat) {
        console.log('Concatinate and publish: ' + config.concat_file);
        run = run.pipe(concat(config.concat_file))
                 .pipe(gulp.dest(config.destination));
        //--- Zip: 
        if (config.publish_zip) { 
            console.log('Zip and publish: ' + config.concat_file + '.gz');
            run = run.pipe(gzip({level: 9}))
                     .pipe(gulp.dest(config.destination));
        }
    }
};


/**
 * Function to build javascript files
 *
 * @param {object} config Configuration object
 */
var buildJs = function (config) {

    config = mergeConfig({
        suffix_min       : '.min',
        publish_original : true,
        publish_minify   : false,
        publish_concat   : true,
        publish_zip      : true
    }, config);

    //--- Run:

    var run = gulp.src(config.src);

    //--- Copy files:
    if (config.publish_original) {
        console.log('Publish original files');
        run = run.pipe(gulp.dest(config.destination));
    }

    //--- Minify:
    if (config.publish_minify || config.publish_concat) {
        console.log('Minify js');
        run = run.pipe(min_js())
                 .pipe(rename({suffix: config.suffix_min}));
        if (config.publish_minify) {
           console.log('Publish minified js with suffix: ' + config.suffix_min);
           run = run.pipe(gulp.dest(config.destination));
        }
    }

    //--- Concatinate:
    if (config.publish_concat) {
        console.log('Concatinate and publish: ' + config.concat_file);
        run = run.pipe(concat(config.concat_file))
                 .pipe(gulp.dest(config.destination));
        //--- Zip: 
        if (config.publish_zip) { 
            console.log('Zip and publish: ' + config.concat_file + '.gz');
            run = run.pipe(gzip({level: 9}))
                     .pipe(gulp.dest(config.destination));
        }
    }
};


/**
 * Function to merge config objects
 * 
 * @param {object} destination Destination object
 * @param {object} source      Source object
 */
var mergeConfig = function (destination, source) {

    if (!destination || typeof(destination) !== 'object') destination = {};
    if (!source || typeof(source) !== 'object') source = {};

    for(var key in source) {
        destination[key] = source[key];
    }

    return destination;
};