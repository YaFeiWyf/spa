/*
 *spa.util_b.js
 *Public module api for SPA ,only can be used in browser, it will not work in server
 *wangyafei 2016/04/30
*/

/*jslint
	browser:true, continue:true,
	devel:true,   indent:2,   
	maxerr:50,    newcap:true,
	nomen:true,   plusplus:true,
	regexp:true,  sloppy:true,
	vars:true,    white:true
*/
spa.util_b=
	(function(){
		var configMap={
			regexp_encode_html : /[&"'><]/g,
			regexp_encode_noamp : /["'><]/g,
			html_encode_map : {
				'&' : '&#38;',
				'"' : '&#34;',
				"'" : '&#39;',
				'>' : '&#62;',
				'<' : '&#60;'
			}
		},
		decodeHtml,
		encodeHtml,
		getEmSize;

		configMap.encode_noamp_map=$.extend( {}, configMap.html_encode_map);
		delete configMap.encode_noamp_map['&'];

		/*Begin decodeHtml*/
		decodeHtml=function( str ){
			return $('<div/>').html(str || '').text();
		};

		/*Begin encodeHtml*/
		encodeHtml=function( input_arg_str, exclude_amp ){
			var input_str = String( input_arg_str ),
				regex,
				lookup_map;
			if( exclude_amp ){
				lookup_map = configMap.encode_noamp_map;
				regex = configMap.regexp_encode_noamp;
			}else {
				lookup_map = configMap.html_encode_map;
				regex = configMap.regexp_encode_html;
			}

			return input_str.replace(regex,
					function( match, name ){
						return lookup_map[match] || '';
					}
				);
		};

		/*Begin getEmSize*/
		getEmSize=function( elem ){
			return Number(
					getComputedStyle( elem, '' ).fontSize.match(/\d*\.?\d*/)[0]
				);
		};
		return {
			decodeHtml : decodeHtml,
			encodeHtml : encodeHtml,
			getEmSize  : getEmSize
		};
	}());