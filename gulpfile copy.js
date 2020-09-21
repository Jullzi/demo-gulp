// 实现这个项目的构建任务

const { src, dest, parallel, series, watch} = require("gulp");

const del = require('del');
//样式编译 
/* 将.scss文件编译为.css文件 */
// const plugins.sass = require('gulp-sass')

// //脚本编译
// const plugins.babel = require('gulp-babel');

// //页面模板编译
// const plugins.swig = require('gulp-swig')
const data = {
  menus: [
    {
      name: "Home",
      icon: "aperture",
      link: "index.html",
    },
    {
      name: "Features",
      link: "features.html",
    },
    {
      name: "About",
      link: "about.html",
    },
    {
      name: "Contact",
      link: "#",
      children: [
        {
          name: "Twitter",
          link: "https://twitter.com/w_zce",
        },
        {
          name: "About",
          link: "https://weibo.com/zceme",
        },
        {
          name: "divider",
        },
        {
          name: "About",
          link: "https://github.com/zce",
        },
      ],
    },
  ],
  pkg: require("./package.json"),
  date: new Date(),
};

// // 图片和字体文件转换
// const plugins.imagemin = require('gulp-imagemin')

const loadPlugins = require('gulp-load-plugins');
const plugins = loadPlugins()

//热更新服务器
const browserSync = require('browser-sync')
const bs = browserSync.create() //创建一个服务器

const clean = () => {  //promise任务
    return del(['dist'])
}

const style = () => {
    return src('src/assets/styles/*.scss', { base: 'src'})
        .pipe(plugins.sass({ outputStyle: 'expanded'}))
        .pipe(dest('temp'))
        // .pipe(bs.reload({ stream:  true})) //将文件以流的方式推送到浏览器 和serve下的files作用相同，二者用其一
}

const script = () => {
  return src("src/assets/scripts/*.js", { base: "src" })
    .pipe(plugins.babel({ presets: ["@babel/preset-env"] }))
    .pipe(dest("temp"));
  // .pipe(bs.reload({ stream:  true})) //将文件以流的方式推送到浏览器 和serve下的files作用相同，二者用其一
}

const page = () => {
  return src("src/*.html", { base: "src" })
    .pipe(plugins.swig({ data }))
    .pipe(dest("temp"))
  // .pipe(bs.reload({ stream:  true})) //将文件以流的方式推送到浏览器 和serve下的files作用相同，二者用其一
}

const image = () => {
    return src('src/assets/images/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

const font = () => {
    return src('src/assets/fonts/**', { base: 'src' })
        .pipe(plugins.imagemin())
        .pipe(dest('dist'))
}

const extra = () => {
    return src('public/**', { base: 'public'})
        .pipe(dest('dist'))
}
const serve = () => {
        //构建优化-监听源代码中文件，源代码发生改变就重新执行对应的构建方法
        watch("src/assets/styles/*.scss", style), 
        watch("src/assets/scripts/*.js", script),
        watch("src/*.html", page),
        
        // 以下文件仅仅是被压缩，开发时并不需要再次构建，可在src目录文件下查找
        // watch("src/assets/images/**", image),
        // watch("src/assets/fonts/", font),
        // watch("public/**", extra)

        //为减少构建次数，以下文件采用数组处理方式，发生变化时，监听自动重新加载更新浏览器
        watch([
            'src/assets/images/**', 
            'src/assets/fonts/**', 
            'public/**'
        ], bs.reload)

        bs.init({
            notify: false,
            port: "8082",
            files: "dist/**", //监听文件
            // open: false, 是否自动打开浏览器
            server: {
                baseDir: ['temp', 'src', 'public'], //指定查找目录
                routes: {
                "/node_modules": "node_modules",
                },
            },
        });
}
const compile = parallel(style, script, page) 
const useref = () => {
  return src("temp/*.html", { base: "temp" })
    .pipe(plugins.useref({ searchPath: ["dist", "."] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        })
      )
    )
    .pipe(dest("dist"));
};
const develop = series(compile, serve);
const build = series(clean, parallel(series(compile,useref), image, font, extra));



module.exports = {
    clean,
    build,
    develop
}