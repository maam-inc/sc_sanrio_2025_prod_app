const {
  src, dest, watch, series, parallel,
} = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const notifier = require('node-notifier');
const postcss = require('gulp-postcss');
const gulpCopy = require('gulp-copy')
const autoprefixer = require('autoprefixer');
const cssdeclsort = require('css-declaration-sorter');
const sassGlob = require('gulp-sass-glob');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
// const fibers = require('fibers');
const browserSync = require('browser-sync');
const rename = require('gulp-rename');
// sass.compiler = require('sass');

const minimist = require('minimist');

const options = minimist(process.argv.slice(2), {
  string: 'env',
  default: { env: 'development' },
});

const PROD = options.env === 'build';
const BREAKPOINT = 768;
const PROTOCOL = 'https';
const SERVER_NAME = 'www.dot-st.com';

const PRJ_NAME = "sanrio_2025_sc"
// PRJ_NAMEを書き換える
const DIR = 'studioclip/cp/'+PRJ_NAME;
const ASSET_DIR = 'static/docs/studioclip/pages/'+PRJ_NAME;

//他のdot-st系のプロジェクトの場合は上記を変更
// const DIR = 'nikoand/cp/'+PRJ_NAME;
// const ASSET_DIR = 'static/docs/nikoand/pages/'+PRJ_NAME;


const CSS_DIR = `/assets/css/`;
const JS_DIR = `/assets/js/`;
const IMG_DIR = `/assets/images/app/`;

const ROOT = './dist/';
const HOST_NAME = `${PROTOCOL}://${SERVER_NAME}`;
const CANONICAL_ROOT = `${HOST_NAME}/${DIR}`;
const INDEX_DIR = `${ROOT}/${DIR}`;

const errorHandler = (error) => {
  notifier.notify(
    {
      title: 'エラー発生！',
      message: error.message,
      sound: true,
    },
    () => {
      console.log(error.message);
    },
  );
};

const compilePug = (done) => {
  src(
    [
      'src/pug/**.pug',
      'src/pug/**/*.pug',
      'src/pug/**/**/*.pug',
      '!src/pug/_*/*.pug',
      '!src/pug/_*/**/*.pug',
      '!src/pug/**/_*/**.pug',
    ],
    { sourcemaps: PROD ? false : true },
  )
    .pipe(plumber({ errorHandler }))
    .pipe(
      pug({
        pretty: true,
        locals: {
          PROD,
          DIR,
          CSS_DIR: `${ASSET_DIR}${CSS_DIR}`,
          JS_DIR: `${ASSET_DIR}${JS_DIR}`,
          IMG_DIR: `/${ASSET_DIR}${IMG_DIR}`,
          BREAKPOINT,
          CANONICAL_ROOT,
          now: new Date(),
        },
      }),
    )
    .pipe(dest(INDEX_DIR /* { sourcemaps: './sourcemaps'} */));
  done();
};


const compileSass = (done) => {
  const postcssPlugins = [
    autoprefixer({
      cascade: false,
    }),
    cssdeclsort({ order: 'alphabetical' /* smacss, concentric-css */ }),
  ];
  src([
    'src/scss/**/*.scss',
    '!src/scss/_*/**.scss',
    '!src/scss/_*/**/**.scss',
    '!src/scss/**/_*/**.scss',
  ], { sourcemaps: false })
    .pipe(plumber({ errorHandler }))
    .pipe(sassGlob())
    .pipe(sass({
      // fiber: fibers,
      outputStyle: 'expanded',
      // outputStyle: 'compressed',
    }))
    .pipe(postcss(postcssPlugins))
    .pipe(gcmq())
    .pipe(cleanCSS({ rebase: false }))//コメントアウトでcssの圧縮をなくす
    .pipe(dest(`${ROOT}${ASSET_DIR}/${CSS_DIR}`) /* , { sourcemaps: './sourcemaps'} */);
  done(); // 終了宣言
};

const buildServer = (done) => {
  const PORT = 3000;

  browserSync({
    files: ROOT+'/**/*',
    startPath: DIR,
    reloadDelay: 3000,
    server: {
      baseDir: ROOT // ルートとなるディレクトリを指定
    }
  });

  done();
};

const browserReload = (done) => {
  browserSync.reload();
  done();
};

const watchFiles = () => {
  watch(['src/pug/**/*.pug'], series(compilePug, browserReload));
  watch(['src/scss/**/*.scss','src/scss/**/*.sass'], series(compileSass, browserReload));
  watch(['src/js/'], series(browserReload));
};

if (PROD) {
  exports.default = series(
    parallel(compilePug, compileSass),
  );
} else {
  exports.default = series(
    parallel(compilePug, compileSass),
    parallel(buildServer, watchFiles),
  );
}
