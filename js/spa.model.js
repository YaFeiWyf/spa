/*
 *spa.model.js
 *Model module for SPA
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

spa.model=
	(function(){
		'use strict';
		var configMap={
				anon_id : 'a0'
			},
			stateMap={
				anon_user : null,
				cid_serial : 0,
				user : null,
				people_cid_map : {},
				people_db : TAFFY(),
				is_connected:false
			},
			isFakeData=true,
			personProto,
			makeCid,
			clearPeopleDb,
			completeLogin,
			makePerson,
			removePerson,
			people,
			chat,
			initModule;

		personProto={
			get_is_user : function(){
				return this.cid === stateMap.user.cid;
			},
			get_is_anon : function(){
				return this.cid === stateMap.anon_user.cid;
			}
		};

		makeCid=function(){
			return 'c'+String( stateMap.cid_serial++ );
		};

		clearPeopleDb=function(){
			var user=stateMap.user;
			stateMap.people_db = TAFFY();
			stateMap.people_cid_map = {};
			if( user ){
				stateMap.people_db.insert( user );
				stateMap.people_cid_map[ user.cid ]=user;
			}
		};

		completeLogin=function( user_list ){
			var user_map=user_list[0];
			delete stateMap.people_cid_map[ user_map.cid ];
			stateMap.user.cid=user_map._id;
			stateMap.user.id =user_map._id;
			stateMap.user.css_map=user_map.css_map;
			stateMap.people_cid_map[ user_map._id ]=stateMap.user;

			//when we add chat, we should join here
			$.gevent.publish('spa-login', [stateMap.user]);
		};

		makePerson=function( person_map ){
			var person,
				cid = person_map.cid,
				css_map = person_map.css_map,
				id = person_map.id,
				name = person_map.name;

				if( cid===undefined || !name){
					throw 'client id and name required';
				}

				person = Object.create(personProto);
				person.cid = cid;
				person.name = name;
				person.css_map = css_map;

				if( id ){
					person.id = id;
				}
				stateMap.people_cid_map[ cid ]=person;
				stateMap.people_db.insert( person );
				return person;
		};

		removePerson=function( person ){
			if(!person){
				return false;
			}
			if( person.id===configMap.anon_id){
				return false;
			}
			stateMap.people_db({cid:person.cid}).remove();
			delete stateMap.people_cid_map[ person.cid ];
			return true;
		};

/*		people={
			get_db:function(){
				return stateMap.people_db;
			},
			get_cid_map:function(){
				return  stateMap.people_cid_map;
			}
		};*/
		people=(function(){
			var get_by_cid, get_db, get_user, login, logout;

			get_by_cid=function( cid ){
				return stateMap.people_cid_map[ cid ];/*stateMap.people_db({cid:cid}).first();*/
			};

			get_db=function(){
				return stateMap.people_db;
			};

			get_user=function(){
				return stateMap.user;
			};

			login=function( name ){
				var sio=isFakeData? spa.fake.mockSio:spa.data.getSio();
				stateMap.user = makePerson({
					cid : makeCid(),
					css_map : {top:25, left:25, 'background-color':'#8f8'},
					name : name
				});
				//注册当后端发布userupdate 消息时完成登入过程的回调函数
				sio.on('userupdate', completeLogin);
				//向后端发送adduser消息，携带用户的详细信息
				sio.emit( 'adduser', {
					cid : stateMap.user.cid,
					css_map : stateMap.user.css_map,
					name : stateMap.user.name
				});
			};

			logout=function(){
				var is_removed, user=stateMap.user;
				is_removed = removePerson(user);
				stateMap.user = stateMap.anon_user;
				$.gevent.publish('spa-logout', [user]);
				return is_removed;
			};

			return {
				get_by_cid : get_by_cid,
				get_db : get_db,
				get_user : get_user,
				login : login,
				logout : logout
			};
		}());

		/*chat*/
		chat=(function(){
			var _publish_listchange, _updata_list, _leave_chat, join_chat;
			_updata_list = function(arg_list){
				var i, person_map, make_person_map, people_list=arg_list[0];
				clearPeopleDb();

				PERSON:
				for(i=0; i<people_list.length; i++){
					person_map = people_list[i];
					if(!person_map.name){
						continue PERSON;
					}

					//if user defined, updata css_map and skip remainder
					if( stateMap.user && stateMap.user.id===person_map.id ){
						stateMap.user.css_map=person_map.css_map;
						continue PERSON;
					}

					make_person_map = {
						cid : person_map._id,
						css_map : person_map.css_map,
						id : person_map._id,
						name : person_map.name
					};
					makePerson( make_person_map );
				}
				stateMap.people_db.sort( 'name' );
			};

			_publish_listchange = function(arg_list){
				_updata_list(arg_list);
				$.gevent.publish( 'spa-listchange', [ arg_list ]);
			};

			_leave_chat = function(){
				var sio = isFakeData?spa.fake.mockSio : spa.data.getSio();
				stateMap.is_connected = false;
				if(sio){
					sio.emit('leavechat');
				}
			};

			join_chat = function(){
				var sio;
				if(stateMap.is_connected){
					return false;
				}
				if(stateMap.user.get_is_anon()){
					console.warn('User must be defined before joining chat');
					return false;
				}
				sio = isFakeData?spa.fake.mockSio : spa.data.getSio();
				sio.on('listchange', _publish_listchange);
				stateMap.is_connected=true;
				return true;
			};

			return {
				_leave : _leave_chat,
				join : join_chat
			};
		}());
		
		initModule=function(){
			var i, people_list, person_map;
			stateMap.anon_user=makePerson({
				cid : configMap.anon_id,
				id  : configMap.anon_id,
				name: 'anonymous'
			});
			stateMap.user = stateMap.anon_user;

			if( isFakeData ){
				people_list=spa.fake.getPeopleList();
				for( i=0; i<people_list.length; i++){
					person_map = people_list[i];
					makePerson({
						id : person_map.id,
						cid : person_map.id,
						css_map : person_map.css_map,
						name : person_map.name
					});
				}
			}
		};

		return {
			initModule : initModule,
			people : people
		};
	}());