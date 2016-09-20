/*
 *spa.util.js
 *Public module api for SPA both browser and server
 *wangyafei 2016/04/29
*/

/*jslint
	browser:true, continue:true,
	devel:true,   indent:2,   
	maxerr:50,    newcap:true,
	nomen:true,   plusplus:true,
	regexp:true,  sloppy:true,
	vars:true,    white:true
*/

spa.util=
	(function(){
		var makeError,
			setConfigMap;

		/*
			*Begin public construct makeError
			*arguments:
				name_text : the error_name
				msg_text  : long error message
				data      : optional data attached to error object
		*/
		makeError = function( name_text, msg_text, data ){
			var error = new Error();
			error.name = name_text;
			error.message = msg_text;
			if( data ){
				error.data = data;
			}
			return error;
		};

		/*Begin public method setConfigMap*/
		setConfigMap = function( arg_map ){
			var input_map = arg_map.input_map,
				settable_map = arg_map.settable_map,
				config_map = arg_map.config_map,
				key_name,
				error;
			for( key_name in input_map ){
				if( input_map.hasOwnProperty( key_name ) ){
					if( settable_map.hasOwnProperty( key_name ) && settable_map[key_name] ){
						config_map[key_name] = input_map[key_name];
					}else {
						error = makeError( 'Bad Input', 'Setting config ket |'+key_name+'| is not supported');
						throw error;
					}
				}
			}
		};

		return {
			makeError : makeError,
			setConfigMap : setConfigMap
		};
	}());