//引入gulp
const gulp=require('gulp')
//压缩html
const htmlmin=require('gulp-htmlmin')
const config=require('./config') // 在这里因为取的是index，所以可以省略index 默认找index
//热更新服务器
const connect = require('gulp-connect')
//css
const concat=require('gulp-concat')
const minifycss=require('gulp-minify-css')
const autoprefixer=require('gulp-autoprefixer')
const rename=require('gulp-rename')
const merge=require('merge-stream')
const webpack=require('webpack-stream')
const inject = require('gulp-inject')
//编译sass
const sass=require('gulp-sass')
//处理html 将src中的html文件传输到dist中去
gulp.task('handle:html',function(){
	//html压缩的配置
	/*var options=
	{
		removeComments: true,//清除HTML注释
        collapseWhitespace: true,//压缩HTML
        collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true,//压缩页面JS
        minifyCSS: true//压缩页面CSS
	}*/
	return gulp.src('./src/views/*/*.html')
			//.pipe(htmlmin(config.htmloptions))
	       .pipe(gulp.dest('./dist'))//自动创建文件夹
})
//处理css 合并css 压缩css 前缀 输出
gulp.task('handle:css',function(){
	let streams=[]
	for(const page in config.cssoptions){
		for(const file in config.cssoptions[page]){
			let stream=gulp.src(config.cssoptions[page][file])
					.pipe(sass({outputStyle: 'compressed'}))//把sass编译成css
					.pipe(autoprefixer({
			            browsers: ['last 2 versions','Safari >0', 'Explorer >0', 'Edge >0', 'Opera >0', 'Firefox >=20'],//last 2 versions- 主流浏览器的最新两个版本
			            cascade: true, //是否美化属性值 默认：true 像这样：
			            //-webkit-transform: rotate(45deg);
			            //        transform: rotate(45deg);
			            remove:true //是否去掉不必要的前缀 默认：true 
			        }))
					.pipe(concat(file+'.css')) //合并css
		       		//.pipe(minifycss()) //压缩css
		       		.pipe(rename({suffix:'.min'})) //设置压缩文件名
		       		.pipe(gulp.dest('./dist/'+page+'/css'))
		    streams.push(stream) 	
		}
	}
	return merge(...streams)//合并多个文件流
	//...是es6中的展开运算符
})
//处理js es6->es5 合并 压缩
gulp.task('handle:js',function(){
//	gulp.src('src/entry.js')
//			.pipe(webpack({
//				mode:'production',//设置打包模式none production(压缩代码) development
//				//单入口 单出口
//				/*entry:'./src/views/index/javascripts/index.js',
//				output:{
//					filename:'index.js'*/
//				//多入口 单出口
//				/*entry:['./src/views/index/javascripts/index.js','./src/views/index/javascripts/vendor.js'],
//				output:{
//					filename:'index.js'*/
//				//多入口 多出口
//				entry:{
//					index:'./src/views/index/javascripts/index.js',
//					vendor:'./src/views/index/javascripts/vendor.js'
//				},
//				output:{
//					filename:'[name].min.js'
//				}
//			}))
//			.pipe(gulp.dest('./dist/index/js'))
	let streams=[]
	for(const page in config.jsoptions){
		let entry=config.jsoptions[page]
		let filename=Array.isArray(entry)||((typeof entry)==='string')?page:'[name]'
		let stream=gulp.src('src/entry.js')
				.pipe(webpack({
					mode:'production',
					entry:entry,
					output:{
						filename:filename+'.min.js'
					},
					module: {
	                    rules: [ //webpack中在这里使用各种loader对代码进行各种编译
	                        {
	                            test: /\.js$/, // 对js文件进行处理
	                            loader: 'babel-loader', // 使用babel-loader对其进行处理
	                            query: {
	                                presets: ['es2015'] // 将es6编译一下
	                            }
	                        }
	                    ]
	                }
				}))
				.pipe(gulp.dest('./dist/'+page+'/js'))
		streams.push(stream)
	}
	return merge(...streams)
})

gulp.task('inject', function () {
	setTimeout(()=>{
		config.pages.forEach(page=>{
			var target = gulp.src('./dist/'+page+'/'+page+'.html');
			// It's not necessary to read the files (will speed up things), we're only after their paths:
			var sources = gulp.src(['./dist/'+page+'/js/*.js', './dist/'+page+'/css/*.css'], {read: false});
	 
			target.pipe(inject(sources,{ignorePath:'/dist'}))
					  .pipe(gulp.dest('./dist/'+page+''));
		})
	},1000)
})

//监听
gulp.task('watch',function(){
	gulp.watch('./src/views/*/*.html',['handle:html','inject','reload'])
	gulp.watch('./src/**/*.scss',['handle:css','inject','reload'])
	gulp.watch('./src/**/*.js',['handle:js','inject','reload'])
})
//默认任务
gulp.task('default',['server','handle:html','handle:css','handle:js','inject','watch'])
//创建热更新服务器z
gulp.task('server', function () {
    connect.server(config.serveroptions)
})
// 让服务器刷新的任务
gulp.task("reload", function(){
	return gulp.src("./dist/**/*.html") //让所有的html文件都重新加载一下
		.pipe(connect.reload());
})