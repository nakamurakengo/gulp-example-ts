import gulp from "gulp";
import type { TaskFunction } from "gulp";
import imagemin, { mozjpeg, optipng, svgo } from "gulp-imagemin";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import ts from "gulp-typescript";
import sourcemaps from "gulp-sourcemaps";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import cleanCSS from "gulp-clean-css";
import terser from "gulp-terser";
import { deleteAsync } from "del";

const { dest, src, watch, series, parallel } = gulp;
const sass = gulpSass(dartSass);

// Source
const srcStyles = "src/styles";
const srcImages = "src/images";
const srcScripts = "src/scripts";

// Destination
const destStyles = `build/styles`;
const destImages = `build/images`;
const destScripts = `build/scripts`;

const clean: TaskFunction = async () => {
  await deleteAsync([`build/*/`]);
};

const compileSass: TaskFunction = () => {
  return src(`${srcStyles}/**/*.{sass,scss}`)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write("."))
    .pipe(dest(destStyles));
};

const copyImages: TaskFunction = () => {
  return src(`${srcImages}/**/*.{png,gif,jpg,svg}`)
    .pipe(
      imagemin([
        // gifsicle({ interlaced: true }),
        mozjpeg({ progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          plugins: [
            { name: "removeViewBox", active: false },
            { name: "collapseGroups", active: true },
          ],
        }),
      ])
    )
    .pipe(dest(destImages));
};

const compileScripts: TaskFunction = () => {
  const tsProject = ts.createProject("tsconfig.json");
  return src(`${srcScripts}/**/*.{js,ts}`)
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write("."))
    .pipe(dest(destScripts));
};

const minifyJs: TaskFunction = () => {
  return src(`${destScripts}/**/*.js`).pipe(terser()).pipe(dest(destScripts));
};

const minifyCss: TaskFunction = () => {
  return src(`${destStyles}/**/*.css`)
    .pipe(cleanCSS({ compatibility: "ie8" }))
    .pipe(dest(destStyles));
};

const defaultTasks: TaskFunction = () => {
  watch(`${srcStyles}/**/*.{sass,scss}`, compileSass);
  watch(`${srcImages}/**/*.{png,gif,jpg,svg}`, copyImages);
  watch(`${srcScripts}/**/*.{js,ts}`, compileScripts);
};

export const build = series(
  clean,
  parallel(compileSass, copyImages, compileScripts),
  parallel(minifyCss, minifyJs)
);

export default defaultTasks;
