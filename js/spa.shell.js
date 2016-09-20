/*
 *spa.shell.js
 *Shell module for SPA
 *wangyafei 2016/04/28
*/

/*jslint
	browser:true, continue:true,
	devel:true,   indent:2,   
	maxerr:50,    newcap:true,
	nomen:true,   plusplus:true,
	regexp:true,  sloppy:true,
	vars:true,    white:true
*/

spa.shell=
	(function(){
		'user strict';
		var configMap={
				main_html:String()
					+'<div class="spa-shell-head">'
						+'<div class="spa-shell-head-logo">'
							+'<h1>SPA</h1>'
							+'<p>javascript end to end</p>'
						+'</div>'
						+'<div class="spa-shell-head-account"></div>'
						+'<div class="spa-shell-head-search"></div>'
					+'</div>'
					+'<div class="spa-shell-main">'
						+'<div class="spa-shell-main-nav"></div>'
						+'<div class="spa-shell-main-content"></div>'
					+'</div>'
					+'<div class="spa-shell-foot"></div>'
					+'<div class="spa-shell-modal"></div>',
				anchor_schema_map:{
					chat:{
						opened:true,
						closed:true
					}
				},
				resize_interval:200
			},
			stateMap={ 
				$container : null,
				anchor_map : {},
				resize_idto : null
			}, 
			jqueryMap={},
			setJqueryMap,
			copyAnchorMap,
			changeAnchorPart,
			onHashchange,
			onResize,
			onTapAcct,
			onLogin,
			onLogout,
			setChatAnchor,
			initModule;

			setJqueryMap=function(){
				var $container=stateMap.$container;
				jqueryMap={ 
					$container:$container,
					$account:$container.find('.spa-shell-head-account'),
					$nav:$container.find('.spa-shell-main-nav')
				};
			};

			onTapAcct=function( event ){
				var acct_text, user_name, user=spa.model.people.get_user();
				if(user.get_is_anon()){
					user_name=prompt('Please sign-in');
					spa.model.people.login( user_name );
					jqueryMap.$account.text( '...processing...' );
				}else{
					spa.model.people.logout();
				}
				return false;
			};

			onLogin=function(event, login_user){
				jqueryMap.$account.text(login_user.name);
			};

			onLogout=function(event, logout_user){
				jqueryMap.$account.text('Please sign-in');
			};

			copyAnchorMap=function(){
				return $.extend(true, {}, stateMap.anchor_map);
			};

			changeAnchorPart=function( arg_map ){
				var anchor_map_revise=copyAnchorMap(),
					bool_return=true,
					key_name,
					key_name_dep;
				KEYVAL:
				for( key_name in arg_map ){
					if( arg_map.hasOwnProperty( key_name ) ){
						if( key_name.indexOf('_')===0){
							continue KEYVAL;
						}

						anchor_map_revise[key_name] = arg_map[key_name];
						key_name_dep='_'+key_name;
						if( arg_map[key_name_dep] ){
							anchor_map_revise[key_name_dep]=arg_map[key_name_dep];
						}else {
							delete anchor_map_revise[key_name_dep];
							delete anchor_map_revise['_s'+key_name_dep];
						}
					}
				}

				//begin attemp to update URI; revert if not success
				try{
					$.uriAnchor.setAnchor( anchor_map_revise );
				}catch(error){
					//replace URI with existing state
					$.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
					bool_return=false;
				}
				return bool_return;
			};

			onHashchange=function( event ){
				var anchor_map_previous=copyAnchorMap(),
					anchor_map_proposed,
					_s_chat_previous,
					_s_chat_proposed,
					is_ok=true;
				try{
					anchor_map_proposed=$.uriAnchor.makeAnchorMap();
				}catch(error){
					$.uriAnchor.setAnchor( anchor_map_previous, null, true);
					return false;
				}
				stateMap.anchor_map = anchor_map_proposed;
				_s_chat_previous = anchor_map_previous._s_chat;
				_s_chat_proposed = anchor_map_proposed._s_chat;

				if( !anchor_map_previous || _s_chat_previous !== _s_chat_proposed) {
					s_chat_proposed = anchor_map_proposed.chat;
					switch( s_chat_proposed ){
						case 'opened':
							is_ok = spa.chat.setSliderPosition( 'opened' );
							break;
						case 'closed':
							is_ok = spa.chat.setSliderPosition( 'closed' );
							break;
						default:
							spa.chat.setSliderPosition( 'closed' );
							delete anchor_map_proposed.chat;
							$.uriAnchor.setAnchor( anchor_map_proposed, null, true);
					}
				}

				//Begin revert anchor if slider change denied
				if(!is_ok){
					if(anchor_map_previous){
						$.uriAnchor.setAnchor( anchor_map_previous, null, true);
						stateMap.anchor_map=anchor_map_previous;
					}else {
						delete anchor_map_proposed.chat;
						$.uriAnchor.setAnchor( anchor_map_proposed, null, true);

					}
				}
				return false;
			};

			/*
				*Begin public method setChatAnchor
				*Example : spa.chat.setChatAnchor('closed')
				*Arguments : position_type - ('closed', 'opened')
				*Action:
				*	Change the URI anchor parameter 'chat'  to the requested
				*	value if possible
				*Return:
				*	true - the requested anchor part was updated
				*	false - the requested anchor part was not updated
			*/
			setChatAnchor=function( position_type ){
				return changeAnchorPart({ chat : position_type });
			};


/*			toggleChat=function( do_extend, callback){
				var px_chat_ht=jqueryMap.$chat.height(),
					is_open   =px_chat_ht==configMap.chat_extend_height,
					is_closed =px_chat_ht==configMap.chat_retract_height,
					is_sliding=!is_open&&!is_closed;

					if(is_sliding){
						return false;
					}

					if(do_extend){
						jqueryMap.$chat
						.animate(
							{
								height:configMap.chat_extend_height
							},
							configMap.chat_extend_time,
							function(){
								stateMap.is_chat_retracted=false;
								if(callback){
									callback(jqueryMap.$chat);
								}
							})
						.attr('title',configMap.chat_extend_title);
						return true;
					}

					jqueryMap.$chat
					.animate(
						{
							height:configMap.chat_retract_height
						},
						configMap.chat_retract_time,
						function(){
							stateMap.is_chat_retracted=true;
							if(callback){
								callback(jqueryMap.$chat);
							}
						})
					.attr('title',configMap.chat_retract_title);
					return true;
			};

			onClickChat=function(event){
				changeAnchorPart({
					chat: (stateMap.is_chat_retracted ? 'open':'closed')
				});
				return false;
			};*/

			/*Begin onResize function*/
			onResize=function(){
				if( stateMap.resize_idto ){
					return true;
				}
				spa.chat.handleResize();
				stateMap.resize_idto=setTimeout(function(){
					stateMap.resize_idto = null;
				}, configMap.resize_interval);

				return true;
			};

			initModule=function( $container ){
				//load html and set jqueryMap
				stateMap.$container=$container;
				$container.html(configMap.main_html);
				setJqueryMap();

				//config urianchor to use our schema
				$.uriAnchor.configModule({
					schema_map : configMap.anchor_schema_map
				});

				//config and init feature modules
				spa.chat.configModule({
					set_chat_anchor : setChatAnchor,
					chat_model : spa.model.chat,
					people_model : spa.model.people  
				});
				spa.chat.initModule( jqueryMap.$container );
				$(window)
					.bind('hashchange', onHashchange)
					.bind('resize', onResize)
					.trigger('hashchange');
				$.gevent.subscribe($container, 'spa-login', onLogin);
				$.gevent.subscribe($container, 'spa-logout', onLogout);
				jqueryMap.$account.text('Please sign-in').bind('utap', onTapAcct);
			};

			return { initModule:initModule };
	}());