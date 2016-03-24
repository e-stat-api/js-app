//**********************************************//
//
// eStatのインスタンスを生成
//
//**********************************************//
// APIの種類を生成する
function underbar_case(s){
	return s.replace(/\.?([A-Z]+)/g, function(x, y){ return "_" + y; }).replace(/^_/, "").toUpperCase();
}
// キャピタルにする
function capitalize(string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}
// url queryの作成
function build_queries(q){
	return Object.keys(q).map(function(key){ return key + (q[key] ? "=" + q[key] : "");}).join("&");
}
function drawTooltip(d, axis, tooltip){
	var  _tooltip_html  = '';
	tooltip.transition()
		.duration(500)
		.style("opacity", 0);
	tooltip.transition()
		.duration(200)
		.style("opacity", .9);
	var tooltip_html = ''
	tooltip_html += d[axis].name+':'+d.$
	tooltip_html += d.unit != undefined ? d.unit : '';
	tooltip.html(tooltip_html)
	.style("left", (d3.event.pageX) + "px")
	.style("top", (d3.event.pageY - 5) + "px");
	tooltip.style("visibility", "visible"); 
}
function moveTooltip(d, tooltip){
	return tooltip.style("top", (event.pageY-20)+"px").style("left",(event.pageX+10)+"px");
}
function removeTooltip(d, tooltip){
	return tooltip.style("visibility", "hidden");
}


var estatAPI = function(o){
	return new Promise(function(resolve, reject){
		var url = estatAPI.buildUrl(o);
		var api = underbar_case(o.api);
		if(o.userData != undefined)
		{
			if(o.api == estatAPI.config.GET_META_INFO)
			{
				o.userData.METADATA.GET_META_INFO.PARAMETER.STATS_DATA_ID = null
				resolve(o.userData.METADATA)
			}
			else
			{
				resolve(o.userData.STATDATA)
			}
		}
		else
		{
			$.getJSON(url).done(function(data){
				if(data[api].RESULT.STATUS !== 0)
				{
					reject({
						status: data[api].RESULT.STATUS,
						error_msg: data[api].RESULT.ERROR_MSG
					});
					return;
				}
				resolve(data);
			}).fail(function(e){
				reject(e);
			});
		}
	});

};
estatAPI.config = {
	 URL			: "http://api.e-stat.go.jp/rest/2.0/app/json/"
	,GET_STATS_LIST	:"getStatsList"
	,GET_META_INFO	: "getMetaInfo"
	,GET_STATS_DATA	: "getStatsData"
	,metaGetFlg		: 'N'
}
estatAPI.buildUrl = function(o){
	var q = {
		appId: o.appId
	};
	if (o.api === estatAPI.config.GET_STATS_LIST)
	{
		throw new Error('unimplemented');
	}
	else if (o.api === estatAPI.config.GET_META_INFO)
	{
		q.statsDataId = o.statsDataId;
	}
	else if (o.api === estatAPI.config.GET_STATS_DATA)
	{
		q.statsDataId = o.statsDataId;
		q.metaGetFlg = estatAPI.config.metaGetFlg;
		Object.keys(o.filters).filter(function(key){
			return key === "time" || key === "area" || /^cat/.test(key);
		}).forEach(function(key){
			var params = o.filters[key];
			if (typeof params === "string")
			{
				q["cd" + capitalize(key)] = params;
				return;
			}
			if (params.lv	)
			{
				q["lv" + capitalize(key)] = params.lv;
			}
			if (params.cd	)
			{
				q["cd" + capitalize(key)] = params.cd;
			}
			if (params.from	) 
			{
				q["cd" + capitalize(key) + "From"] = params.from;
			}
			if (params.to	)
			{
				q["cd" + capitalize(key) + "To"] = params.to;
			}
		});
	}
	return estatAPI.config.URL + o.api + "?" + build_queries(q);
};
	
//**********************************************//
//
// イベント
//
//**********************************************//

function eventer(){ this._events = {}; }
eventer.prototype = {
	 on : function(nm, fn) 
	{
		if (!(nm in this._events))
		{
			this._events[nm] = [];
		}
		this._events[nm].push(fn);
	}
	,off : function(nm, fn)
	{
		if (!(nm in this._events)) return;
		this._events[nm] = this._events[nm].filter(function(ev){
			return ev !== fn;
		});
	}
	,emit: function(nm)
	{
		if (!(nm in this._events)) return;
		var len = this._events[nm].length;
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < len; i++)
		{
			this._events[nm][i].apply(this, args);
		}
	}
	,trigger : function()
	{
		return this.emit.apply(this, arguments);
	}

};

//**********************************************//
//
// component
//
//**********************************************//

function viewer(id){
	eventer.call(this);
	if (typeof id === "string")
	{
		this.element = $("#" + id);
	}
	else if (id !== undefined && id !== null)
	{
		this.element = $(id);
	}
	else if (typeof this.render === "function")
	{
		this.element = this.render();
	}
}
viewer.prototype = Object.create(eventer.prototype, {
	constructor: {
		 value: viewer
		,enumerable: false
	}
	,remove: {
		value: function()
		{
			this.element.remove();
		}
	}
});
// loading_view
function loading_view(id){
	viewer.call(this, id);
	this._visible = false;
}
loading_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		 value: loading_view
		,enumerable: false
	}
	,visible: {
		get: function(){
			return this._visible;
		}
		,set: function(){
			this._visible = true;
			this.element.addClass("show");
		}
	}
	,show: {
		value: function(){
			this._visible = true;
			this.element.addClass("show");
		}
	}
	,hide: {
		value: function(){
			this._visible = false;
			this.element.removeClass("show");
			this.trigger("close");
		}
	}
	,toggle: {
		value: function(){
			if (this._visible)
			{
				this.hide()
			}
			else
			{
				this.show();
			}
		}
	}
});

// sidebar
function side_bar(id, tabs){
	viewer.call(this, id);
	var _this = this;
	this._selected = -1;
	if (tabs === undefined) tabs = [];
	this._tabs = tabs;
	tabs.forEach(function(tab, i){
		var el = $(tab.element);
		if (i === 0)
		{
			this._selected = 0;
			el.show();
		}
		else el.hide();
		this._tabs[i].el = el;
		this._tabs[i].tab = $("<a>", {
			 class: "tab" + (i === 0 ? " active" : "")
			,text: tab.text
			,href: "#"
			,click: function(e){
				e.preventDefault();
				_this.select(i);
			}
		}).appendTo(this.element);
	}, this);
}
side_bar.prototype = Object.create(viewer.prototype, {
	constructor: {
		 value		: side_bar
		,enumerable	: false
	}
	,selected_index	: {
		get: function(){
			return this._selected;
		}
	}
	,select: {
		value: function(i){
			if (i === this._selected) return;
			this._tabs[i].tab.addClass("active");
			this._tabs[i].el.show();
			this._tabs[this._selected].tab.removeClass("active");
			this._tabs[this._selected].el.hide();
			this._selected = i;
		}
	}

});

function selector_view(id){
	viewer.call(this, id);

	var _this = this;
	this.onSelecting = null;
	this._elText = this.element.find(".selector-text");
	this._elSubtext = this.element.find(".selector-subtitle");
	this._elIcon = this.element.find(".selector-icon");
	this._text = "";
	this._icon = "";
	this._iconFixed = false;
	this._selected_index = -1;
	this._scrollTop = 0;
	this.__dialog_view = null;
	this.__dialog_view_close_event_handler = function(){
		_this.__dialog_view.off("select", _this.__dialog_view_select_event_handler);
	};
	this.__dialog_view_select_event_handler = function(item, index){
		if (
			typeof _this.onSelecting === "function" &&
			_this.onSelecting(item, index) === false
		) return;
		_this._select(index, item);
		_this._scrollTop = _this.__dialog_view.scrollTop;
		_this.trigger("select", item, index);
	};

	this.text = "";

	this.element.click(function(e){
		e.preventDefault();
		if (!_this.__dialog_view) return;
		_this.__dialog_view.selected_index = _this._selected_index;
		_this.__dialog_view.scrollTop = _this._scrollTop;
		_this.__dialog_view.on("select", _this.__dialog_view_select_event_handler);
		_this.__dialog_view.show();
	});
}
selector_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		value: selector_view,
		enumerable: false
	}
	,text: {
		get: function(){
			return this._text;
		},
		set: function(value){
			this._text = value || "";
			this._elText.text(value ? value : "　");
		}
	}
	,subtext: {
		get: function(){
			return this._elSubtext.text();
		},
		set: function(value){
			this._elSubtext.text(value);
		}
	}
	,icon: {
		get: function(){
			return this._icon;
		},
		set: function(value){
			if (this._icon)
				this._elIcon.removeClass("icon-" + this._icon);
			if (value)
				this._elIcon.addClass("icon-" + value);
			this._icon = value;
		}
	}
	,iconFixed: {
		get: function(){
			return this._iconFixed;
		},
		set: function(value){
			this._iconFixed = value;
		}
	}
	,_dialog_view: {
		get: function(){
			return this.__dialog_view;
		},
		set: function(value){
			if (this.__dialog_view){
				this.__dialog_view.off("close", this.__dialog_view_close_event_handler);
				this.__dialog_view.off("empty", this.__dialog_viewEmptyEventHandler);
			}
			this.__dialog_view = value;
			if (value){
				value.on("close", this.__dialog_view_close_event_handler);
			}
		}
	}
	,selected_index: {
		get: function(){
			return this._selected_index;
		},
		set: function(value){
			this._select(value);
		}
	}
	,select: {
		value: function(index){
			var item = this._select(index);
			if (!item) return;
			this.trigger("select", item, index);
		}
	}
	,_select: {
		value: function(index, item){
			if (!this.__dialog_view) return null;
			this._selected_index = index;
			if (index < 0){
				if (!this._iconFixed) this.icon = "";
				this.text = "";
				return null;
			}
			item = item || this.__dialog_view.getItem(index);
			if (!this._iconFixed) this.icon = item.icon;
			this.text = item.text;
			return item;
		}
	}
	,render: {
		value: function(){
			return $("<a>",{
					 href	: "#"
					,class	: "selector" 
				}).append(
					[
						 $("<span>", { class: "selector-icon icon" })
						,$("<span>", { class: "selector-content" }).append([
							 $("<span>", { class: "selector-subtitle" })
							,$("<span>", { class: "selector-text" })
						])
					]
				);
		}
	}

});

// list_view

function list_view(id){
	viewer.call(this, id);
	this._selected_index = -1;
	this._items = [];
	this._elements = [];
	this._categories = [];
}
list_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		value: list_view,
		enumerable: false
	}
	,selected_index: {
		get: function(){
			return this._selected_index;
		},
		set: function(value){
			if (this._selected_index === value) return;
			if (this._selected_index >= 0)
				this._elements[this._selected_index].removeClass("active");
			if (value >= 0)
				this._elements[value].addClass("active");
			this._selected_index = value;
		}
	}
	,scrollTop: {
		get: function(){
			return this.element.scrollTop();
		},
		set: function(value){
			this.element.scrollTop(value);
		}
	}
	,select: {
		value: function(index){
			this.selected_index = index;
			this.trigger("select", this._items[index], index);
		}
	}
	,getItem: {
		value: function(index){
			return this._items[index];
		}
	}
	,addItem: {
		value: function(item){
			var cat;
			if (typeof item.category === "number"){
				cat = this._categories[item.category];
			} else if (typeof item.category === "string"){
				this._categories.some(function(category){
					if (category.name === item.category){
						cat = category;
						return true;
					}
					return false;
				});
			} else {
				if (this._categories.length === 0)
					this.addCategory();
				cat = this._categories[0];
			}
			if (cat === undefined)
				throw new Error("カテゴリーがありません");

			var index = this._items.push(item) - 1;
			var element = this._create_item_element(item, index).appendTo(cat.el);
			this._elements.push(element);
		}
	}
	,addAllItems: {
		value: function(items){
			items.forEach(function(item){
				this.addItem(item);
			}, this);
		}
	}
	,addCategory: {
		value: function(category){
			var cat = $.extend({}, category);
			var el = cat.el = $("<div>",{
					class: "list-category"
			});
			this.element.append([
				cat.text ? $("<div>", {
					 text: cat.text
					,class: "list-category-header"
				}) : null
				,el
			]);
			return this._categories.push(cat) - 1;
		}
	}
	,addAllCategories: {
		value: function(categories){
			return categories.forEach(function(cat){
				return this.addCategory(cat);
			}, this);
		}
	}
	,empty: {
		value: function(){
			this.select(-1);
			this._items = [];
			this._elements = [];
			this._categories = [];
			this.element.empty();
		}
	},

	_create_item_element: {
		value: function(item, index){
			var _this = this;
			index = typeof index === "number" ? index : this._items.length;
			return $("<a>", {
				class: "list-item",
				href: "#",
				click: function(e){
					e.preventDefault();
					_this.select(index);
				}
			}).append($("<span>", {
				class: "list-item-inner"
			}).append([$("<span>", {
				class: "list-icon icon" + (item.icon ? " icon-" + item.icon : "")
			}), $("<span>", {
				class: "list-content"
			}).append([item.subtext ? $("<span>", {
				class: "list-subtext",
				text: item.subtext
			}) : null, $("<span>", {
				class: "list-text",
				text: item.text
			})])]));
		}
	}
});

// moal_view

function modal_view(id){
	viewer.call(this, id);
	var _this = this;
	this._visible = false;
	this._elCloseBtn = this.element.find(".modal-close");
	this.element.click(function(e){
		e.preventDefault();
		if (e.target !== _this.element.get(0)) return;
		_this.hide();
	});
	this._elCloseBtn.click(function(e){
		e.preventDefault();
		_this.hide();
	});
}
modal_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		value: modal_view,
		enumerable: false
	}
	,visible: {
		get: function(){
			return this._visible;
		},
		set: function(){
			this._visible = true;
			this.element.addClass("show");
		}
	}
	,show: {
		value: function(){
			this._visible = true;
			this.element.addClass("show");
		}
	}
	,hide: {
		value: function(){
			this._visible = false;
			this.element.removeClass("show");
			this.trigger("close");
		}
	}
	,toggle: {
		value: function(){
			if (this._visible) this.hide();
			else this.show();
		}
	}
});

// Listmodal_view

function list_dialog_view(id){
	modal_view.call(this, id);

	var _this = this;
	this._titleEl = this.element.find(".modal-title");
	this._listView = new list_view(this.element.find(".list"));
	this._listView.on("select", function(item, index){
		_this.trigger("select", item, index);
		_this.hide();
	});
}
list_dialog_view.prototype = Object.create(modal_view.prototype, {
	constructor: {
		value: list_dialog_view,
		enumerable: false
	}
	,render: {
		value: function(){
			return $("<div>", { class: "modal" }).append(
						$("<div>", { class: "modal-inner" }).append([
							 $("<header>", { class: "modal-header" }).append(
								$("<h1>", { class: "modal-title" })
							)
							,$("<div>", { class: "modal-content" }).append(
								 $("<div>", { class: "list" }))
								,$("<footer>", { class: "modal-footer tool-bar" }).append([
									$("<span>", { class: "tool-bar-space" }),
									$("<a>", { href: "#", class: "modal-btn modal-close", text: "閉じる" })
								])
						])
					).appendTo($("body"));
		}
	}
	,title: {
		get: function(){
			return this._titleEl.text();
		},
		set: function(value){
			this._titleEl.text(value);
		}
	}
	,selected_index: {
		get: function(){
			return this._listView.selected_index;
		},
		set: function(value){
			this._listView.selected_index = value;
		}
	}
	,scrollTop: {
		get: function(){
			return this._listView.scrollTop;
		},
		set: function(value){
			this._listView.scrollTop = value;
		}
	}
	,select: {
		value: function(index){
			this.selected_index = index;
			this._listView.trigger("select", this._listView.getItem(index), index);
		}
	}
	,getItem: {
		value: function(index){
			return this._listView.getItem(index);
		}
	}
	,setItems: {
		value: function(items, categories){
			this._listView.empty();
			if (categories) this._listView.addAllCategories(categories);
			this._listView.addAllItems(items);
			this.trigger("empty");
		}
	}
});

function config_dialog_view(id, appId){
	modal_view.call(this, id);
	this._elAppId = $("#" + id + "-appid");
	this._elAppId.val(appId || "");
}
config_dialog_view.KEY_APP_ID = "estat-appid";
config_dialog_view.prototype = Object.create(modal_view.prototype, {
	constructor: {
		 value: config_dialog_view
		,enumerable: false
	}
	,appId: {
		get: function(){
			return this._elAppId.val();
		}
	}
	,hide: {
		value: function(){
			modal_view.prototype.hide.call(this);
			this.trigger("save", this._elAppId.val());
		}
	}
});

function Data(){
	eventer.call(this);
	this._expression = Data.DRAW_TYPE_BAR_CHART;
	this.data = [0, 0].map(function(){
		return {
			 enabled	: true
			,canDraw	: false
			,statsId	: ""
			,metadata	: []
			,codes		: {}
			,axis		: -1
			,filters	: {}
			,data		: []
		};
	});
	this._busy = false;
}

Data.CHART_TYPE_BAR_CHART = 0;
Data.CHART_TYPE_LINE_CHART = 1;
Data.CHART_TYPE_SCATTER_PLOT = 2;
Data.CHART_TYPE_MAP = 3;
Data.prototype = Object.create(eventer.prototype, {
	 busy: {
		get: function(){
			return this._busy;
		}
	}
	,chart_type: {
		get: function(){
			return this._chart_type;
		}
		,set: function(value){
				this._chart_type = value;
				this._checkCanDraw();
				this.draw();
			}
		}
	,fetch_meta_data: {
		value: function(item, index){
			var statsId = item.statsId
			if (this._busy)
				return Promise.reject(new Error("now fetching"));
			this._busy = true;
			this.emit("start");

			var _this = this;
			return estatAPI({
				 api: estatAPI.config.GET_META_INFO
				,appId: App.appId
				,statsDataId: statsId
				,userData:item.userData
			}).then(function(data){
				_this._busy = false;
				_this.emit("stop");
				_this.load_meta_data(data, index);
				return _this.data[index];
			}, function(err){
				_this._busy = false;
				_this.emit("stop");
				return Promise.reject(err);
			});
		}
	}
	,load_meta_data: {
		value: function(data, index){
			var d = this.data[index];
			var co = data.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ;
			d.statsId = data.GET_META_INFO.PARAMETER.STATS_DATA_ID;
			d.axis = 0;
			d.metadata = co.map(function(c){
				return {
					 id: c["@id"]
					,name: c["@name"]
					,cls: (Array.isArray(c.CLASS) ? c.CLASS : [c.CLASS]).map(function(cls){
						return {
							 code	: cls["@code"]
							,name	: cls["@name"].trim()
							,level	: cls["@level"]
							,unit	: cls["@unit"]
						};
					})
				};
			});
			d.codes = d.metadata.reduce(function(a, b){
				a[b.id] = b.cls.map(function(c){ return c.code; });
				return a;
			}, {});
			d.filters = d.metadata.reduce(function(a, b){
				a[b.id] = 0;
				return a;
			}, {});
			d.data = null;
		}
	}
	,fetch_data: {
		value: function(index){
			if (this.chart_type === Data.CHART_TYPE_MAP && index === 1)
				return Promise.reject("Yのデータは地図に使用できません");
			if (this._busy)
				return Promise.reject(new Error("データ取得中..."));
			this._busy = true;
			this.emit("start");
			var _this = this;
			var d = _this.data[index];
			var axis = d.metadata[d.axis].id;
			var filters = Object.keys(d.filters).reduce(function(a, b){
				if (axis !== b)
					a[b] = d.codes[b][d.filters[b]];
				return a;
			}, {});
			var ud = (d.statsId == null)? _userData : undefined;
			return estatAPI({
				 api: estatAPI.config.GET_STATS_DATA
				,appId: App.appId
				,statsDataId: d.statsId
				,filters: filters
				,userData:ud
			}).then(function(data){
				_this._busy = false;
				_this.emit("stop");
				_this.load_data(data, index);
				return d;
			}, function(err){
				_this._busy = false;
				_this.emit("stop");
				return Promise.reject(err);
			});

		}
	}
	,load_data: {
		value: function(data, index){
			var value = data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
			var values = Array.isArray(value) ? value : [value];
			var d = this.data[index];
			d.data = values.map(function(v){
				return Object.keys(v).reduce(function(a, b){
					var key = b.replace(/^@/, "");
					if (key === "$")
					{
						var num = parseFloat(v[b]);
						a[key] = isNaN(num) ? v[b] : num;
						return a;
					} else if (!/^area$|^time$|^cat/.test(key)){
						a[key] = v[b];
						return a;
					}
					var mi = -1, ci = -1;
					d.metadata.some(function(md, i){
						if (md.id === key)
						{
							mi = i;
							return true;
						}
						return false;
					});
					if (mi === -1) return a;
					d.metadata[mi].cls.some(function(c, i){
						if (c.code === v[b])
						{
							ci = i;
							return true;
						}
						return false;
					});
					if (ci === -1) return a;
					a[key] = d.metadata[mi].cls[ci];
					return a;
				}, {});
			});
			this._checkCanDraw();
			this.draw();
		}
	}
	,draw: {
		value: function(){
			this.emit("draw", this);
		}
	}
	,_checkCanDraw: {
		value: function(){
			this.data.forEach(function(d){
				if (d.metadata.length === 0){
					d.canDraw = false;
					return;
				}
				d.canDraw = d.axis >= 0;
			}, this);
		}
	}
});

function data_panel_view(o){
	viewer.call(this, o.element);
	var _this = this;
	this._filters = [];
	this._dataIndex = o.dataIndex || 0;
	this._data = o.data;

	this._dataDialog	 = new list_dialog_view();
	this._metadataDialog = new list_dialog_view();
	this._dataSelector	 = new selector_view();
	this._axisSelector	 = new selector_view();

	this._dataDialog.title = "データ";
	this._dataDialog.setItems(window.app_data );
	this._metadataDialog.title = "メタデータ";

	this._dataSelector.subtext = "データ";
	this._dataSelector._dialog_view = this._dataDialog;
	this._dataSelector.onSelecting = function(){
		return !_this._data.busy;
	};
	this._dataSelector.on("select", function(item){
		_this._data.fetch_meta_data(item, _this._dataIndex).then(function(data){
			_this._metadataDialog.setItems(data.metadata.map(function(d){
				return {
					 icon: "database"
					,text: d.name
					,subtext: d.id
				};
			}));

			_this._axisSelector.selected_index = data.axis;

			_this._filters.forEach(function(f){
				f._dialog_view.element.remove();
				f._selector_view.element.remove();
			});

			_this._filters = data.metadata.map(function(d){
				var _dialog_view = new list_dialog_view();
				_dialog_view.title = d.name;
				_dialog_view.setItems(d.cls.map(function(cls){
					return {
						icon: "database",
						text: cls.name,
						subtext: item.statsId + " " + d.id + " " + cls.code
					};
				}));
				var _selector_view = new selector_view();
				_selector_view.subtext = d.name;
				_selector_view.iconFixed = true;
				_selector_view.icon = "database";
				_selector_view._dialog_view = _dialog_view;
				_selector_view.selected_index = data.filters[d.id];
				_selector_view.onSelecting = function(){
					return !_this._data.busy;
				};
				_selector_view.on("select", function(clsItem, index){
					data.filters[d.id] = index;
					_this._data.fetch_data(_this._dataIndex).catch(onError);
				});
				_this.element.append(_selector_view.element);
				return {
					_dialog_view: _dialog_view,
					_selector_view: _selector_view
				};
			});

			_this._data.fetch_data(_this._dataIndex).catch(onError);
		}).catch(onError);
	});

	this._axisSelector.subtext = "横軸";
	this._axisSelector._dialog_view = this._metadataDialog;
	this._axisSelector.onSelecting = function(){
		return !_this._data.busy;
	};
	this._axisSelector.on("select", function(item, index){
		_this._data.data[_this._dataIndex].axis = index;
		_this._data.fetch_data(_this._dataIndex).catch(onError);
	});

	this._dataSelector.element.appendTo(this.element);
	this._axisSelector.element.appendTo(this.element);
	this.element.append($("<hr>"));

	function onError(err){
		console.error(err);
	}
}
data_panel_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		value: data_panel_view,
		enumerable: false
	}
	,refresh: {
		value: function(){
		}
	}
});


function chart_view(element){
	viewer.call(this, element);

	this._ow = this._oh = 0;
	this._data = null;
}
chart_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		 value: chart_view
		,enumerable: false
	}
	,init: {
		value: function(){
			var _this = this
			this._svg = d3.select(this.element[0]).append("svg");

			resize(this.element.width(), this.element.height());
			timer();

			function timer(){
				window.requestAnimationFrame(resizeCb);
			}

			function resizeCb(){
				var width = _this.element.width();
				var height = _this.element.height();
				if (_this._width === width && _this._height === height)
					return timer();
				resize(width, height);
				timer();
			}

			function resize(w, h){
				_this._width = w;
				_this._height = h;
				_this._svg.attr({
					width: _this._width,
					height: _this._height
				});
				_this.draw();
			}
		}
	}
	,draw: {
		value: function(data){
			if(!data)
			{
				data = this._data;
			}
			else
			{
				this._data = data;
			}

			if (!data) return;
			var draw;
			if (d3.select('svg')){
				this._svg = d3.select('svg')
				this._width  = this._svg.attr('width')
				this._height = this._svg.attr('height')
			}
			this._svg.select("g").remove();
			$('.tooltip').remove();
			if (data.chart_type === Data.CHART_TYPE_BAR_CHART)
			{
				draw = this.bar_chart;
			}
			else if (data.chart_type === Data.CHART_TYPE_LINE_CHART)
			{
				draw = this.line_chart;
			}
			else if (data.chart_type === Data.CHART_TYPE_SCATTER_PLOT)
			{
				draw = this.scatter_plot;
			}
			if (!draw) return;
			draw(data, this._svg, this._width, this._height);
			throw false;
		}
		
	}
	// 棒グラフ
	,bar_chart		: {
		value: function(data, svg, w, h){
			var dat = data.data[0];

			if (!dat.canDraw) return;

			var axis = dat.metadata[dat.axis].id;
			var unit = dat.data[0].unit || "";
			var dataset = data._selected != undefined ? 
				$.grep(dat.data, function(x,i){ return data._selected[i] == true;}, false) :
				dat.data;
			var margin = { top: 20, right: 20, bottom: 30, left: 100 };
			var width = w - margin.left - margin.right;
			var height = h - margin.top - margin.bottom;

			var g = svg.append("g")
				.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

			var x = d3.scale.ordinal()
				.domain(dataset.map(function(d){ return d[axis].name; }))
				.rangeRoundBands([0, width], 0.1);

			var y = d3.scale.linear()
				.domain([0, d3.max(dataset, function(d){ return d.$; })])
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.ticks(10)
			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.ticks(10, unit);
			var tooltip = d3.select("body")
				.append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			g.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0, " + height + ")")
				.call(xAxis);

			g.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(unit);

			g.selectAll(".bar")
				.data(dataset)
				.enter()
				.append("rect")
				.attr("class", "bar")
				.attr("x", function(d){ return x(d[axis].name); })
				.attr("width", x.rangeBand())
				.attr("y", function(d){ return y(d.$); })
				.attr("height",  function(d){ return height - y(d.$); })
				.on("mouseover", function(d){ drawTooltip(d, axis, tooltip) })
 				.on("mousemove", function(d){ return moveTooltip(d, tooltip) })
 				.on("mouseout",  function(d){ return removeTooltip(d, tooltip)	});
		}
	}
	// 折れ線グラフ
	,line_chart		: {
		value: function(data, svg, w, h){
			var dat = data.data[0];
			if (!dat.canDraw) return;

			var axis = dat.metadata[dat.axis].id;
			var unit = dat.data[0].unit || "";
			var dataset = data._selected != undefined ? 
				$.grep(dat.data, function(x,i){ return data._selected[i] == true;}, false) :
				dat.data;

			var margin = { top: 20, right: 20, bottom: 30, left: 100 };
			var width = w - margin.left - margin.right;
			var height = h - margin.top - margin.bottom;

			var g = svg.append("g")
				.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

			var x = d3.scale.ordinal()
				.domain(dataset.map(function(d){ return d[axis].name; }))
				.rangePoints([0, width]);

			var y = d3.scale.linear()
				.domain([0, d3.max(dataset, function(d){ return d.$; })])
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.ticks(10, unit);

			var line = d3.svg.line()
				.x(function(d){ return x(d[axis].name); })
				.y(function(d){ return y(d.$); });

			var tooltip = d3.select("body")
				.append("div")  // declare the tooltip div 
				.attr("class", "tooltip")              // apply the 'tooltip' class
				.style("opacity", 0);                  // set the opacity to nil

			g.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0, " + height + ")")
				.call(xAxis);

			g.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text(unit);

			g.append("path")
				.datum(dataset)
				.attr("class", "line")
				.attr("d", line);
			g.append("g")
				.attr("class", "line-point")
				.selectAll("circle")
				.data(dataset)
				.enter()
				.append("circle")
				.attr("cx", function(d){ return x(d[axis].name);	})
				.attr("cy", function(d){ return y(d.$);				})
				.attr("r", 5)
				.on("mouseover", function(d){ drawTooltip(d, axis ,tooltip) })
				.on("mousemove", function(d){ return moveTooltip(d, tooltip) })
				.on("mouseout",  function(d){ return removeTooltip(d, tooltip)	});
		}
	}
	// 散布図の描画
	,scatter_plot	: {
		value : function(data, svg, w, h){
		var dat = {
			 x:data.data[0]
			,y:data.data[1]
		}

		function getTick(t,minimum_t){
			minimum_t = (minimum_t==undefined)? 5 : minimum_t;
			return (Math.floor(t.data.length/minimum_t) < 1)? minimum_t : Math.floor(t.data.length/minimum_t);
		}
	
		if (!dat.x.canDraw || !dat.y.canDraw) return;
		if (dat.x.data.length != dat.y.data.length) return;
		var axis = {
			 x:dat.x.metadata[dat.x.axis].id
			,y:dat.y.metadata[dat.y.axis].id
		};
		var unit = {
			 x: dat.x.data[0].unit || ""
			,y: dat.y.data[0].unit || ""
		};
		var dataset = dat.x.data;
		var margin = { top: 20, right: 20, bottom: 30, left: 100 };
		var width  = w - margin.left - margin.right;
		var height = h - margin.top - margin.bottom;
		var svg = svg.append("g")
			.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
		var dataset = dat.x.data.map(function(d){ return {'x':d.$}; })
		dat.y.data.map(function(d,i){ 	dataset[i]['y'] = d.$ })
		dat.x.data.map(function(d,i){ 	dataset[i]['z'] = d[dat.x.metadata[dat.x.axis].id].name })
		var _axis = (data._selected != undefined)?
			{
				 x:$.grep(dat.x.data, function(x,i){ return data._selected[i] == true; }).map(function(d){ return d.$; })
				,y:$.grep(dat.y.data, function(x,i){ return data._selected[i] == true; }).map(function(d){ return d.$; })
			}:
			{
				 x : dat.x.data.map(function(d){ return d.$; })
				,y : dat.y.data.map(function(d){ return d.$; })
			}
		var _unit = {
			 x : dat.x.data[0].unit
			,y : dat.y.data[0].unit
		}
		var _tick = {
			  x:getTick(dat.x,10)
			 ,y:getTick(dat.y)
		}
		var _circleSize = function(){	
			return 10
		}
		var xScale = d3.scale.linear()
				.domain([Math.min.apply(null, _axis.x),Math.max.apply(null, _axis.x)])
				.range([0,width]);

		var yScale = d3.scale.linear()
				.domain([Math.min.apply(null, _axis.y),Math.max.apply(null, _axis.y)])
				.range([height,0]);
		
		var colorCategoryScale = d3.scale.category10();

		var xAxis = d3.svg.axis()
			.scale(xScale)
			.orient("bottom")
			.ticks(_tick.x)
			.tickFormat(function(d){ return d+_unit.x; });

		var yAxis = d3.svg.axis()
			.ticks(_tick.y)
			.scale(yScale)
			.orient("left")
			.tickSize(6, -width);

		var tooltip = d3.select("body")
			.append("div") 
			.attr("class", "tooltip")
			.style("opacity", 0);
		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis)
			.append("text")
			.attr("y", -10)
			.attr("x",10)
			.style("text-anchor", "end")
			.text(_unit.y); 
		svg.append("g")
			.attr("class", "x axis")
			.call(xAxis)
			.attr("transform", "translate(0," + height + ")")
			.style("text-anchor", "end")
			.text(_unit.x); 
		svg.selectAll("circle")
			.data(dataset)
			.enter()
			.append("svg:circle")
			.attr("r",_circleSize())
			.attr("fill", function(d){ return colorCategoryScale(d["z"]); })
			.attr("cx", function(d){ return xScale(d["x"]); })
			.attr("cy", function(d){ return yScale(d["y"]); })
			.on("mouseover", function(d){
				console.log(d)
				console.log(123456)
				tooltip.transition()
					.duration(500)
					.style("opacity", 0);
				tooltip.transition()
					.duration(200)
					.style("opacity", .9);
				tooltip.html([
					   d.z
					 ,'x:'+d.x
					 ,'y:'+d.y
				].join('<br />'))
				.style("left", (d3.event.pageX) + "px")
				.style("top", (d3.event.pageY - 5) + "px");
				tooltip.style("visibility", "visible"); 
			})
			.on("mousemove", function(d){ 
				return tooltip.style("top", (event.pageY-20)+"px").style("left",(event.pageX+10)+"px");
			})
			.on("mouseout", function(d){
				return tooltip.style("visibility", "hidden");
			})
	}
	}
});

function table_view(element, index){
	viewer.call(this, element);
	this.index = index || 0;
	this._head = this.element.find("thead");
	this._body = this.element.find("tbody");
	if (this._head.length === 0)
		this._head = $("<thead>").appendTo(this.element);
	if (this._body.length === 0)
		this._body = $("<tbody>").appendTo(this.element);
}
table_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		 value: table_view
		,enumerable: false
	}
	,init: {
		value: function(){
		}
	}
	,draw: {
		value: function(data){
			var dat = data.data[this.index];

			var _this = this;
			var _table_index = this.index
			this._head.empty();
			this._body.empty();
			if (!dat.canDraw) return;
			var thead_tr = [
 				 dat.metadata[dat.axis].name
				,"値"
				,"単位"
			]
			if(_this.index == 0)
				thead_tr.unshift('表示')
			this._head.append($("<tr>").append(thead_tr.map(function(t){return $("<td>", { text: t });})));
			this._body.append(
				data.data[this.index].data.map(function(d,i){
					var _tr = [
						 $("<td>", {
							text: d[dat.metadata[dat.axis].id].name
						})
						,$("<td>", {
							text: d.$,
							class: "main-table-val"
						})
						,$("<td>", {
							text: d.unit
						})
					]
					if(_this.index == 0)
					{
						_tr.unshift($("<td>", {
							html: $('<input/>').attr({
								 'type'		:'checkbox'
								,'checked'	:'checked'
								,'class'	:'selected_data'
								,'value'	:i
							}).on('click',function(){
								data._selected = [];
								$('#table1 input.selected_data').each(function(){ 
									data._selected.push($(this).prop('checked') == true ? true : false); 
								})
								chart_view.prototype.draw(data)
							})
						}))
					}
					return $("<tr>").append(_tr);
				})
			);
		}
	}

});

//**********************************************//
//												//
// 地図											//
//												//
//**********************************************//
function map_view(element){
	viewer.call(this, element);
}
map_view.prototype = Object.create(viewer.prototype, {
	constructor: {
		value: map_view,
		enumerable: false
	}
	,init: {
		value: function(){
			this.map = L.map(this.element[0]);
			L.tileLayer("http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png", {
				attribution: "<a href='http://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
			}).addTo(this.map);
			this.map.setView([37, 139], 5);
			this.marker = [];
		}
	}
	,draw: {
		value: function(data){
			var marker_data = {}
			data.data[0].data.map(function(d){
				if(pref_points[d.area.name] != undefined)
				{
					marker_data[d.area.name] = {
						 $		: d.$
						,unit	: d.unit
						,point	: pref_points[d.area.name]
					}
				}
				
			})
			
			if(this.marker.length > 0)
			{
				for(var i = 0; i < this.marker.length; i++)
				{
					this.map.removeLayer(this.marker[i])
				}
				this.marker = []
			}
			for(var k in marker_data)
			{
				this.marker.push(
					new L.marker(marker_data[k].point,{}).addTo(this.map).bindPopup(k+':'+marker_data[k].$+marker_data[k].unit)
				)
			}		
		}
	}
});

//**********************************************//
//												//
// visualization_view							//
//												//
//**********************************************//

function visualization_view(){
	viewer.call(this);
	this.chart_view	 = new chart_view("chart");
	this.mapView	 = new map_view("map");
	this.tableView1	 = new table_view("table1", 0);
	this.tableView2	 = new table_view("table2", 1);
}
visualization_view.prototype = Object.create(viewer.prototype, {

	constructor: {
		value: visualization_view,
		enumerable: false
	},

	init: {
		value: function(){
			this.chart_view.init();
			this.mapView.init();
			this.tableView1.init();
			this.tableView2.init();
		}
	},

	draw: {
		value: function(data){
			this.tableView1.draw(data);
			this.tableView2.draw(data);
			if (data.chart_type === Data.CHART_TYPE_MAP){
				this.mapView.draw(data);
				this.show_map();
			} else {
				this.chart_view.draw(data);
				this.show_chart();
			}
		}
	},

	show_chart: {
		value: function(){
			this.chart_view.element.addClass("show");
			this.mapView.element.removeClass("show");
		}
	},

	show_map: {
		value: function(){
			this.chart_view.element.removeClass("show");
			this.mapView.element.addClass("show");
		}
	}
});


// App
function App(){
}

App.appId = "";
App.KEY_APP_ID = "estat-appid";
App.loadAppId = function(){
	try{
		App.appId = window.localStorage.getItem(App.KEY_APP_ID) || "";
	}catch(e){
		App.appId = document.cookie.replace('appId=','')
	}
};
App.saveAppId = function(appId){
	App.appId = appId;
	try{
		window.localStorage.setItem(App.KEY_APP_ID, appId);
	}catch(e){
		document.cookie= 'appId='+appId
	}
};

App.prototype = {
	 loadAppId:function(){
		App.loadAppId();
		// appId 
		this._appId =  App.appId
		
	 }
	,init: function(){
		var _this = this;
		// data
		this.data = new Data();
		this.data.on("start", function(    ){ _this._loading.show(); });
		this.data.on("stop" , function(    ){ _this._loading.hide(); });
		this.data.on("draw" , function(data){ _this._visualizationView.draw(data); });
		// settings
		var modal = new config_dialog_view("config", App.appId);
		modal.on("save", function(appId){ App.saveAppId(appId); });
// 		$('#save-appId').(function(appId){
// //			App.saveAppId($(this).val());
// 			console.log($(this).val())
// 		})
		$("#save-appId").click(function(e){
//			App.saveAppId($(this).val());
			console.log($('#config-appid').val())
// 			e.preventDefault();
// 			modal.show(); 
		});

		// loading indicator

		this._loading = new loading_view("loading");

		// chart_type

		this._chart_typeDialog = new list_dialog_view();
		this._chart_typeDialog.title = "グラフ";
		this._chart_typeDialog.setItems([
			 { text: "棒グラフ"		, icon: "bar-chart"		, chart_type: Data.CHART_TYPE_BAR_CHART }
			,{ text: "折れ線グラフ"	, icon: "line-chart"	, chart_type: Data.CHART_TYPE_LINE_CHART }
			,{ text: "散布図"			, icon: "scatter-plot"	, chart_type: Data.CHART_TYPE_SCATTER_PLOT }
			,{ text: "地図"			, icon: "map-plot"		, chart_type: Data.CHART_TYPE_MAP }
		]);

		this._plot_type_selector = new selector_view("chart-type-selector");
		this._plot_type_selector._dialog_view = this._chart_typeDialog;
		this._plot_type_selector.on("select", function(item){
			_this.data.chart_type = item.chart_type;
			_this.dataPanel1.refresh();
			_this.dataPanel2.refresh();
		});

		// panels

		this.dataPanel1 = new data_panel_view({
			 element: "side-bar-tab1"
			,dataIndex: 0
			,data: this.data
		});

		this.dataPanel2 = new data_panel_view({
			 element: "side-bar-tab2"
			,dataIndex: 1
			,data: this.data
		});

		// side-bar

		this._tabbar = new side_bar("side-bar-tab-bar", [
			 { text: "X", element: this.dataPanel1.element }
			,{ text: "Y", element: this.dataPanel2.element }
		]);

		// visualization

		this._visualizationView = new visualization_view("visualization");
		this._visualizationView.init();

		this._plot_type_selector.select(0);
	}

};

function initialization(){
}
initialization.data_load = function(){
	var app = new App();
	app.loadAppId();
	var appId = app._appId == '' ? prompt('AppIdを入力してください') : app._appId;
	try{
		window.localStorage.setItem(App.KEY_APP_ID, appId);
	}catch(e){
		document.cookie= 'appId='+appId
	}
	// appId 
	window.app_data = [];
	if(location.search != '')
	{
		var uri_queries = {}		
		location.search.replace(/^\?/ig, '').split('&').map(function(x){
			kv =x.split('=')
			return uri_queries[kv[0]] = kv[1]
		})
		var statIds = uri_queries.statIds != undefined & uri_queries.statIds.length > 0 ? uri_queries.statIds.split(',') : ['',''];
	}
	else
	{
		var statIds = ['','']
	}
	statIds.forEach(function(x){
		$('<li/>').append(
			$('<input/>').attr({
				 'type'  : 'text'
				,'class' : 'statsId'
				,'value' : x
				,'placeholder':'統計IDを入力して下さい'
			})
			,$('<span/>').text('x').click(function(){ $(this).parents('li').remove(); })
		).insertBefore('.add-statsId')
	})
	
	var loading = function(d){
		statIds.map(function(statId){
			return estatAPI({
				 api		: estatAPI.config.GET_META_INFO
				,appId		: appId
				,statsDataId: statId
			}).then(function(data){
				window.app_data.push({
					 text	 :data.GET_META_INFO.METADATA_INF.TABLE_INF.STATISTICS_NAME
					,subtext : data.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME['$']
					,statsId : data.GET_META_INFO.METADATA_INF.TABLE_INF['@id']
					,icon	 : 'database'
				})
			})
		})
		try{
			var userData = JSON.parse(window.localStorage.getItem('userData'))
			var loadingDataList = setInterval(function(){
				if(window.app_data.length > 0){
					var sum  = function(arr){
						return arr.reduce(function(prev, current, i, arr){
							return prev+current;
						});
					};
					if(sum(window.app_data.map(function(x,i){
						return (x.text)? 1:0;
					})) >= statIds.length){
						clearInterval(loadingDataList)
						/*
						o.userData.METADATA.GET_META_INFO.PARAMETER.STATS_DATA_ID もnullにする
						*/
						if(userData != null){
							window.app_data.push({		
								 text	 : 'ユーザー:'+userData.METADATA.GET_META_INFO.METADATA_INF.TABLE_INF.STATISTICS_NAME
								,subtext : 'user:'+userData.METADATA.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME['$']
								,statsId : null
								,icon	 : 'database'
								,userData: userData
							})
						}
						app.init();
					}
				}
			},100)
			_userData = userData
		}catch(e){
			alert('このブラウザはローカルで使用できない機能があります。')
		}
	}
	loading()
}
var _userData;
$(function(){
	initialization.data_load();

	var file = document.querySelector('#file');
	file.onchange = function (){
		var fileList = file.files;
		var reader = new FileReader();
		reader.readAsText(fileList[0]);
		reader.onload = function(){
			var userData = (reader.result)
			window.localStorage.setItem('userData', userData);
			location.href = '';
		};
	};

});	

/*
To Do
自分のデータの保存
CSSの修正(画像を含む)
Readmd.md5の作成
githubへのアップ
*/