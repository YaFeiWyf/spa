var webpack = require('webpack');

module.exports={
	entry:'./js/spa.js',
	output:{
		path:'./static',
		filename:'bundle.js'
	},
	module: {
		loaders:[
			{
				test: /\.js$/
				loader: 'babel-loader',
				query:{
					presets: ['es2015', 'react']
				}
			},
			{
				test: /\.css$/,
				loader:'style-loader!css-loader'
			},
			{
				test: /\.scss$/,
				loader:'style-loader!css-loader!sass-loader'
			},
			{
				// inline base64 URLs for <=8k images, direct URLs for the rest
				test: /\.(png|jpg)$/,
				loader:'url-loader?limit=8192'
			}
		]
	}
};