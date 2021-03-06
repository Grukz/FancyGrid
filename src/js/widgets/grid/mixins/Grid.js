/*
 * @mixin Fancy.grid.mixin.Grid
 */
Fancy.Mixin('Fancy.grid.mixin.Grid', {
  tpl: [
    '<div class="{leftCls} {leftEmptyCls}"></div>',
    '<div class="{centerCls}"></div>',
    '<div class="{rightCls} {rightEmptyCls}"></div>',
    '<div class="fancy-grid-editors"></div>'
  ],
  /*
   *
   */
  initStore: function(){
    var me = this,
      fields = me.getFieldsFromData(me.data),
      modelName = 'Fancy.model.'+Fancy.id(),
      data = me.data,
      remoteSort,
      remoteFilter,
      collapsed = false,
      state = me.state;

    if(me.data.items){
      data = me.data.items;
    }

    remoteSort = me.data.remoteSort;
    remoteFilter = me.data.remoteFilter;

    Fancy.define(modelName, {
      extend: Fancy.Model,
      fields: fields
    });

    if(me.grouping && me.grouping.collapsed !==  undefined){
      collapsed = me.grouping.collapsed;
    }

    var storeConfig = {
      widget: me,
      model: modelName,
      data: data,
      paging: me.paging,
      remoteSort: remoteSort,
      remoteFilter: remoteFilter,
      collapsed: collapsed,
      multiSort: me.multiSort
    };

    if(state){
      if(state.filters){
        storeConfig.filters = state.filters;
      }
    }

    if(data.pageSize){
      storeConfig.pageSize = data.pageSize;
    }

    me.store = new Fancy.Store(storeConfig);

    me.model = modelName;
    me.fields = fields;

    if(me.store.filters){
      setTimeout(function() {
        me.filter.filters = me.store.filters;
        me.filter.updateStoreFilters();
      }, 1);
    }
  },
  /*
   *
   */
  initTouch: function(){
    var me = this,
      TOUCH_CLS = Fancy.TOUCH_CLS;

    if(Fancy.isTouch && window.FastClick){
      if(me.panel){
        FastClick.attach(me.panel.el.dom);
        me.panel.addCls(TOUCH_CLS);
      }
      else {
        FastClick.attach(me.el.dom);
        me.addCls(TOUCH_CLS);
      }
    }
  },
  /*
   *
   */
  initElements: function(){
    var me = this;

    if( me.header !== false ){

      me.leftHeader = new Fancy.grid.Header({
        widget: me,
        side: 'left'
      });

      me.header = new Fancy.grid.Header({
        widget: me,
        side: 'center'
      });

      me.rightHeader = new Fancy.grid.Header({
        widget: me,
        side: 'right'
      });
    }

    me.leftBody = new Fancy.grid.Body({
      widget: me,
      side: 'left'
    });

    me.body = new Fancy.grid.Body({
      widget: me,
      side: 'center'
    });

    me.rightBody = new Fancy.grid.Body({
      widget: me,
      side: 'right'
    });

    me.leftEl = me.el.select('.' + me.leftCls);
    me.centerEl = me.el.select('.' + me.centerCls);
    me.rightEl = me.el.select('.' + me.rightCls);
  },
  /*
   * @param {Array} data
   * @return {Array}
   */
  getFieldsFromData: function(data){
    var items = data.items || data;

    if( data.fields){
      return data.fields;
    }

    if( !items ){
      throw new Error('FancyGrid Error 4: Data is empty and not set fields of data to build model');
    }

    var itemZero = items[0],
      fields = [];

    for(var p in itemZero){
      fields.push(p);
    }

    return fields;
  },
  /*
   *
   */
  render: function(){
    var me = this,
      renderTo = me.renderTo || document.body,
      el = Fancy.get( document.createElement('div')),
      panelBodyBorders = me.panelBodyBorders;

    el.addCls(
      Fancy.cls,
      me.widgetCls,
      me.cls
    );

    el.attr('id', me.id);

    if(me.panel === undefined && me.shadow){
      el.addCls('fancy-panel-shadow');
    }

    if(me.columnLines === false){
      el.addCls('fancy-grid-disable-column-lines');
    }

    if( me.theme !== 'default' && !me.panel){
      el.addCls('fancy-theme-' + me.theme);
    }

    var panelBordersWidth = 0,
      panelBorderHeight = 0;

    if(me.panel){
      panelBordersWidth = panelBodyBorders[1] + panelBodyBorders[3];
    }

    el.css({
      width: (me.width - panelBordersWidth) + 'px',
      height: (me.height - panelBorderHeight) + 'px'
    });

    me.initTpl();
    el.update(me.tpl.getHTML({
      leftEmptyCls: me.leftEmptyCls,
      rightEmptyCls: me.rightEmptyCls,
      centerCls: me.centerCls,
      leftCls: me.leftCls,
      rightCls: me.rightCls
    }));

    me.el = Fancy.get(Fancy.get(renderTo).dom.appendChild(el.dom));

    me.setHardBordersWidth();

    me.rendered = true;
  },
  /*
   *
   */
  setHardBordersWidth: function(){
    var me = this,
      borders = me.panel? me.gridBorders : me.gridWithoutPanelBorders;

    if(me.wrapped){
      borders = me.gridBorders;
    }

    me.css({
      'border-top-width': borders[0],
      'border-right-width': borders[1],
      'border-bottom-width': borders[2],
      'border-left-width': borders[3]
    })
  },
  /*
   *
   */
  update: function(){
    var me = this,
      s = me.store;

    if(s.loading){
      return;
    }

    me.updater.update();
    me.fire('update');

    if(me.heightFit){
      me.fitHeight();
    }

    me.setBodysHeight();
  },
  /*
   * @param {String} side
   * @return {Number}
   */
  getColumnsWidth: function(side){
    var me = this;

    switch(side){
      case 'center':
        return me.getCenterFullWidth();
      case 'left':
        return me.getLeftFullWidth();
      case 'right':
        return me.getRightFullWidth();
    }
  },
  /*
   *
   */
  setSides: function(){
    var me = this,
      centerCls = me.centerCls,
      leftCls = me.leftCls,
      rightCls = me.rightCls,
      headerCls = me.headerCls,
      leftColumns = me.leftColumns,
      rightColumns = me.rightColumns,
      leftWidth = me.getLeftFullWidth(),
      centerWidth = me.getCenterFullWidth(),
      rightWidth = me.getRightFullWidth(),
      gridBorders = me.gridBorders,
      panelBodyBorders = me.panelBodyBorders,
      gridWithoutPanelBorders = me.gridWithoutPanelBorders;

    if(leftColumns.length > 0){
      me.leftEl.removeCls(me.leftEmptyCls);
    }

    if(rightColumns.length > 0){
      me.rightEl.removeCls(me.rightEmptyCls);
    }

    if(me.wrapped){
      centerWidth = me.width - gridBorders[1] - gridBorders[3];
    }
    else if(me.panel){
      centerWidth = me.width - gridBorders[1] - gridBorders[3] - panelBodyBorders[1] - panelBodyBorders[3];
    }
    else{
      centerWidth = me.width - gridWithoutPanelBorders[1] - gridWithoutPanelBorders[3];
    }

    if(leftWidth === 0 && rightWidth === 0){}
    else if(rightWidth === 0){
      centerWidth -= leftWidth;
    }
    else if(leftWidth === 0){
      centerWidth -= rightWidth;
    }
    else if(me.width > leftWidth + centerWidth + rightWidth){
      centerWidth -= leftWidth;
    }
    else{
      centerWidth -= leftWidth + rightWidth;
    }

    me.leftEl.css({
      width: leftWidth + 'px'
    });

    me.centerEl.css({
      left: leftWidth + 'px',
      width: centerWidth + 'px'
    });

    if( me.header ) {
      me.el.select('.' + leftCls + ' .' + headerCls).css({
        width: leftWidth + 'px'
      });

      me.el.select('.' + centerCls + ' .' + headerCls).css({
        width: centerWidth + 'px'
      });
    }

    me.el.select('.' + centerCls + ' .fancy-grid-body').css({
      width: centerWidth + 'px'
    });

    if(me.width > leftWidth + centerWidth + rightWidth) {
      me.rightEl.css({
        right: '0px'
      });
    }
    else {
      me.rightEl.css({
        left: '',
        right: '0px'
      });
    }

    me.rightEl.css({
      width: rightWidth
    });

    if( me.header ) {
      me.el.select('.' + rightCls + ' .' + headerCls).css({
        width: rightWidth + 'px'
      });
    }

    me.startWidths = {
      center: centerWidth,
      left: leftWidth,
      right: rightWidth
    };
  },
  /*
   *
   */
  setColumnsPosition: function(){
    var me = this;

    me.body.setColumnsPosition();
    me.leftBody.setColumnsPosition();
    me.rightBody.setColumnsPosition();
  },
  /*
   *
   */
  setSidesHeight: function(){
    var me = this,
      s = me.store,
      height = 1,
      cellHeaderHeight = me.cellHeaderHeight;

    if (me.header !== false) {
      height += cellHeaderHeight;
      if(me.filter && me.filter.header){
        if(me.groupheader){
          if(me.filter.groupHeader){
            height += cellHeaderHeight;
          }
        }
        else{
          height += cellHeaderHeight;
        }
      }

      if(me.groupheader){
        if(!(me.filter && me.filter.header)){
          height += cellHeaderHeight;
        }
        else{
          height += cellHeaderHeight;
        }
      }
    }

    if(me.grouping){
      height += me.grouping.groups.length * me.groupRowHeight;
    }

    if(me.expander){
      height += me.expander.plusHeight;
    }

    if(me.summary){
      height += me.summary.topOffSet;
    }

    height += s.getLength() * me.cellHeight - 1;

    if(me.paging && me.summary && me.summary.position === 'bottom'){
      height = me.height;
    }

    me.leftEl.css({
      height: height + 'px'
    });

    me.centerEl.css({
      height: height + 'px'
    });

    me.rightEl.css({
      height: height + 'px'
    });
  },
  /*
   *
   */
  setBodysHeight: function () {
    var me = this;

    me.body.setHeight();
    me.leftBody.setHeight();
    me.rightBody.setHeight();
  },
  /*
   *
   */
  preRender: function(){
    var me = this;

    if( me.title ||  me.subTitle || me.tbar || me.bbar || me.buttons || me.panel ){
      me.renderPanel();
    }
  },
  /*
   *
   */
  renderPanel: function(){
    var me = this,
      panelConfig = {
        renderTo: me.renderTo,
        title: me.title,
        subTitle: me.subTitle,
        width: me.width,
        height: me.height,
        titleHeight: me.titleHeight,
        subTitleHeight: me.subTitleHeight,
        barHeight: me.barHeight,
        theme: me.theme,
        shadow: me.shadow,
        style: me.style || {},
        window: me.window,
        modal: me.modal,
        frame: me.frame,
        items: [me],
        draggable: me.draggable,
        resizable: me.resizable,
        minWidth: me.minWidth,
        minHeight: me.minHeight,
        panelBodyBorders: me.panelBodyBorders,
        barContainer: me.barContainer,
        barScrollEnabled: me.barScrollEnabled
      },
      panelBodyBorders = me.panelBodyBorders;

    if(me.bbar){
      panelConfig.bbar = me.bbar;
      me.height -= me.barHeight;
    }

    if(me.tbar){
      panelConfig.tbar = me.tbar;
      me.height -= me.barHeight;
    }

    if(me.subTBar){
      panelConfig.subTBar = me.subTBar;
      me.height -= me.barHeight;
    }

    if(me.buttons){
      panelConfig.buttons = me.buttons;
      me.height -= me.barHeight;
    }

    if(me.footer){
      panelConfig.footer = me.footer;
      me.height -= me.barHeight;
    }

    me.panel = new Fancy.Panel(panelConfig);

    me.bbar = me.panel.bbar;
    me.tbar = me.panel.tbar;
    me.subTBar = me.panel.subTBar;
    me.buttons = me.panel.buttons;

    if(!me.wrapped){
      me.panel.addCls('fancy-panel-grid-inside');
    }

    if(me.title) {
      me.height -= me.titleHeight;
    }

    if(me.subTitle) {
      me.height -= me.subTitleHeight;
      me.height += panelBodyBorders[2];
    }

    me.height -= panelBodyBorders[0] + panelBodyBorders[2];

    me.renderTo = me.panel.el.select('.fancy-panel-body-inner').dom;
  },
  /*
   * @return {Number}
   */
  getBodyHeight: function(){
    var me = this,
      height = me.height,
      rows = 1,
      gridBorders = me.gridBorders,
      gridWithoutPanelBorders = me.gridWithoutPanelBorders;

    if(me.groupheader){
      rows = 2;
    }

    if(me.filter && me.filter.header){
      if(me.groupheader) {
        if(me.filter.groupHeader){
          rows++;
        }
      }
      else{
        rows++;
      }
    }

    if( me.header !== false ){
      height -= me.cellHeaderHeight * rows;
    }

    if(me.panel){
      height -= gridBorders[0] + gridBorders[2];
    }
    else{
      height -= gridWithoutPanelBorders[0] + gridWithoutPanelBorders[2];
    }

    if(me.summary){
      height -= me.summary.topOffSet;
      height -= me.summary.bottomOffSet;
    }

    return height;
  },
  /*
   *
   */
  ons: function(){
    var me = this,
      store = me.store,
      docEl = Fancy.get(document);

    store.on('change', me.onChangeStore, me);
    store.on('set', me.onSetStore, me);
    store.on('remove', me.onRemoveStore, me);
    store.on('beforesort', me.onBeforeSortStore, me);
    store.on('sort', me.onSortStore, me);
    store.on('beforeload', me.onBeforeLoadStore, me);
    store.on('load', me.onLoadStore, me);
    docEl.on('mouseup', me.onDocMouseUp, me);
    docEl.on('click', me.onDocClick, me);
    docEl.on('mousemove', me.onDocMove, me);
    store.on('servererror', me.onServerError, me);
    store.on('serversuccess', me.onServerSuccess, me);

    if(me.responsive){
      Fancy.$(window).bind('resize', function(){
        me.onWindowResize()
      });
    }

    me.on('activate', me.onActivate, me);
    me.on('deactivate', me.onDeActivate, me);
  },
  /*
   * @param {Object} grid
   * @param {String} errorTitle
   * @param {String} errorText
   * @param {Object} request
   */
  onServerError: function (grid, errorTitle, errorText, request) {
    this.fire('servererror', errorTitle, errorText, request);
  },
  /*
   * @param {Object} grid
   * @param {Array} data
   * @param {Object} request
   */
  onServerSuccess: function (grid, data, request) {
    this.fire('serversuccess', data, request);
  },
  /*
   *
   */
  onChangeStore: function(){
    this.update();
  },
  /*
   * @param {Object} store
   */
  onBeforeLoadStore: function(store){
    this.fire('beforeload');
  },
  /*
   * @param {Object} store
   * @param {String} id
   * @param {Fancy.Model} record
   */
  onRemoveStore: function(store, id, record){
    var me = this;

    me.fire('remove', id, record);
  },
  /*
   * @param {Object} store
   */
  onLoadStore: function(store){
    this.fire('load');
  },
  /*
   * @param {Object} store
   * @param {Object} o
   */
  onSetStore: function(store, o){
    var me = this;

    me.fire('set', o);
  },
  /*
   * @param {Object} store
   * @param {Object} o
   */
  onBeforeSortStore: function(store, o){
    this.fire('beforesort', o);
  },
  /*
   * @param {Object} store
   * @param {Object} o
   */
  onSortStore: function(store, o){
    this.fire('sort', o);
  },
  /*
   * @return {Number}
   */
  getCellsViewHeight: function(){
    var me = this,
      s = me.store,
      plusScroll = 0,
      scrollBottomHeight = 0;

    if(me.grouping){
      plusScroll += me.grouping.plusScroll;
    }

    if(me.expander){
      plusScroll += me.expander.plusScroll;
    }

    if(!me.scroller.scrollBottomEl || me.scroller.scrollBottomEl.hasCls(Fancy.HIDDEN_CLS)){}
    else {
      scrollBottomHeight = me.scroller.cornerSize;
    }

    return (me.cellHeight) * s.dataView.length + scrollBottomHeight + plusScroll;
  },
  /*
   * @param {Object} e
   */
  onDocMouseUp: function(e){
    this.fire('docmouseup');
  },
  /*
   * @param {Object} e
   */
  onDocClick: function(e){
    this.fire('docclick', e);
  },
  /*
   * @param {Object} e
   */
  onDocMove: function(e){
    this.fire('docmove', e);
  },
  /*
   * @return {Number}
   */
  getCenterViewWidth: function(){
    //Realization could be reason of bug
    var me = this,
      elWidth = me.centerEl.width();

    if(elWidth === 0){
      var columnsWidth = 0,
        columns = me.columns,
        i = 0,
        iL = columns.length;

      for(;i<iL;i++){
        var column = columns[i];
        if(!column.hidden){
          columnsWidth += column.width;
        }
      }

      return columnsWidth;
    }

    return elWidth;
  },
  /*
   * @return {Number}
   */
  getCenterFullWidth: function(){
    var me = this,
      centerColumnsWidths = 0,
      columns = me.columns,
      i = 0,
      iL = columns.length;

    for(;i<iL;i++){
      var column = columns[i];
      if(!column.hidden){
        centerColumnsWidths += column.width;
      }
    }

    return centerColumnsWidths;
  },
  /*
   * @return {Number}
   */
  getLeftFullWidth: function(){
    var me = this,
      width = 0,
      columns = me.leftColumns,
      i = 0,
      iL = columns.length;

    for(;i<iL;i++){
      var column = columns[i];
      if(!column.hidden){
        width += column.width;
      }
    }

    return width;
  },
  /*
   * @return {Number}
   */
  getRightFullWidth: function(){
    var me = this,
      width = 0,
      columns = me.rightColumns,
      i = 0,
      iL = columns.length;

    for(;i<iL;i++){
      var column = columns[i];
      if(!column.hidden){
        width += column.width;
      }
    }

    return width;
  },
  /*
   * @param {String} side
   * @return {Array}
   */
  getColumns: function(side){
    var me = this,
      columns;

    switch(side){
      case 'left':
        columns = me.leftColumns;
        break;
      case 'center':
        columns = me.columns;
        break;
      case 'right':
        columns = me.rightColumns;
        break;
    }

    return columns;
  },
  /*
   * @param {String} side
   * @return {Fancy.grid.Body}
   */
  getBody: function(side){
    var me = this,
      body;

    switch(side){
      case 'left':
        body= me.leftBody;
        break;
      case 'center':
        body = me.body;
        break;
      case 'right':
        body = me.rightBody;
        break;
    }

    return body;
  },
  /*
   * @param {String} side
   * @return {Fancy.grid.Header}
   */
  getHeader: function(side){
    var me = this,
      header;

    switch(side){
      case 'left':
        header = me.leftHeader;
        break;
      case 'center':
        header = me.header;
        break;
      case 'right':
        header = me.rightHeader;
        break;
    }

    return header;
  },
  /*
   * @param {Number} rowIndex
   * @return {Array}
   */
  getDomRow: function(rowIndex){
    var me = this,
      leftBody = me.leftBody,
      body = me.body,
      rightBody = me.rightBody,
      leftColumns = me.leftColumns,
      columns = me.columns,
      rightColumns = me.rightColumns,
      i = 0,
      iL = leftColumns.length,
      cells = [];

    for(;i<iL;i++) {
      cells.push( leftBody.getDomCell(rowIndex, i) );
    }

    i = 0;
    iL = columns.length;
    for(;i<iL;i++) {
      cells.push( body.getDomCell(rowIndex, i) );
    }

    i = 0;
    iL = rightColumns.length;
    for(;i<iL;i++) {
      cells.push( rightBody.getDomCell(rowIndex, i) );
    }

    return cells;
  },
  /*
   *
   */
  initTextSelection: function(){
    var me = this,
      body = me.body,
      leftBody = me.leftBody,
      rightBody = me.rightBody;

    if(me.textSelection === false) {
      me.addCls('fancy-grid-unselectable');

      var fn = function(e){
        var targetEl = Fancy.get(e.target);
        if(targetEl.hasCls('fancy-field-text-input') || targetEl.hasCls('fancy-textarea-text-input')){
          return;
        }

        e.preventDefault();
      };

      body.el.on('mousedown', fn);
      leftBody.el.on('mousedown', fn);
      rightBody.el.on('mousedown', fn);
    }
  },
  /*
   * @param {String} type
   * @param {*} value
   */
  setTrackOver: function(type, value){
    var me = this;

    switch(type){
      case 'cell':
        me.cellTrackOver = value;
        break;
      case 'column':
        me.columnTrackOver = value;
        break;
      case 'row':
        me.trackOver = value;
        break;
    }
  },
  /*
   * @param {String} type
   */
  setSelModel: function(type){
    var me = this,
      selection = me.selection;

    selection.cell = false;
    selection.cells = false;
    selection.row = false;
    selection.rows = false;
    selection.column = false;
    selection.columns = false;
    selection[type] = true;

    if(type === 'rows'){
      me.multiSelect = true;
    }
    else{
      me.multiSelect = false;
    }

    selection.clearSelection();
  },
  /*
   * @param {Boolean} [returnModel]
   * @return {Array}
   */
  getSelection: function(returnModel){
    var me = this;

    return me.selection.getSelection(returnModel);
  },
  /*
   *
   */
  clearSelection: function(){
    var me = this,
      selection = me.selection;

    selection.clearSelection();
  },
  /*
   *
   */
  destroy: function(){
    var me = this,
      docEl = Fancy.get(document);

    docEl.un('mouseup', me.onDocMouseUp, me);
    docEl.un('click', me.onDocClick, me);
    docEl.un('mousemove', me.onDocMove, me);

    me.body.destroy();
    me.leftBody.destroy();
    me.rightBody.destroy();

    me.header.destroy();
    me.leftHeader.destroy();
    me.rightHeader.destroy();

    me.scroller.destroy();

    me.el.destroy();

    if(me.panel){
      me.panel.el.destroy();
    }
  },
  /*
   *
   */
  showAt: function(){
    var me = this;

    if(me.panel){
      me.panel.showAt.apply(me.panel, arguments);
    }
  },
  /*
   *
   */
  show: function(){
    var me = this;

    if(me.panel){
      me.panel.show.apply(me.panel, arguments);
    }
    else{
      me.el.show();
    }
  },
  /*
   *
   */
  hide: function(){
    var me = this;

    if(me.panel){
      me.panel.hide.apply(me.panel, arguments);
    }
    else{
      me.el.hide();
    }
  },
  /*
   *
   */
  initDateColumn: function(){
    var me = this;

    var prepareColumns = function(columns){
      var i = 0,
        iL = columns.length;

      for(;i<iL;i++){
        var column = columns[i];

        if(column.type === 'date'){
          column.format = column.format || {};

          var format = {
            type: 'date'
          };

          Fancy.applyIf(format, me.lang.date);

          Fancy.applyIf(column.format, format);
        }
      }

      return columns;
    };

    me.columns = prepareColumns(me.columns);
    me.leftColumns = prepareColumns(me.leftColumns);
    me.rightColumns = prepareColumns(me.rightColumns);
  },
  /*
   *
   */
  stopEditor: function(){
    var me = this;

    me.edit.stopEditor();
  },
  /*
   * @param {String} id
   * @return {Fancy.Model}
   */
  getById: function(id){
    var me = this;

    return me.store.getById(id);
  },
  /*
   * @param {Number} rowIndex
   * @param {String} key
   * @return {Fancy.Model}
   */
  get: function(rowIndex, key){
    var me = this,
      store = me.store;

    if(key !== undefined){
      return store.get(rowIndex, key);
    }
    else if(rowIndex === undefined){
      return store.get();
    }

    return store.getItem(rowIndex);
  },
  /*
   * @return {Number}
   */
  getTotal: function(){
    return this.store.getTotal();
  },
  /*
   * @return {Number}
   */
  getViewTotal: function(){
    return this.store.getLength();
  },
  /*
   * @return {Array}
   */
  getDataView: function(){
    return this.store.getDataView();
  },
  /*
   * @return {Array}
   */
  getData: function(){
    return this.store.getData();
  },
  /*
   * @param {Number} rowIndex
   */
  selectRow: function(rowIndex){
    var me = this;

    me.selection.selectRow(rowIndex);
  },
  /*
   * @param {String} key
   */
  selectColumn: function(key){
    var me = this,
      side,
      columnIndex,
      leftColumns = me.leftColumns || [],
      columns = me.columns || [],
      rightColumns = me.rightColumns || [];

    var isInSide = function(columns){
      var i = 0,
        iL = columns.length;

      for(;i<iL;i++){
        var column = columns[i];
        if(column.index === key || column.key === key){
          columnIndex = i;
          return true;
        }
      }

      return false;
    };

    if(isInSide(leftColumns)) {
      side = 'left';
    }
    else if(isInSide(columns)) {
      side = 'center';
    }
    else if(isInSide(rightColumns)){
      side = 'right';
    }

    if(side){
      me.selection.selectColumns(columnIndex, side);
    }
  },
  /*
   * @param {String} key
   * @return {Object}
   */
  getColumnByIndex: function(key){
    var me = this,
      leftColumns = me.leftColumns || [],
      columns = me.columns || [],
      rightColumns = me.rightColumns || [],
      _columns = leftColumns.concat(columns).concat(rightColumns),
      i = 0,
      iL = _columns.length;

    for(;i<iL;i++){
      var column = _columns[i];
      if(column.index === key || column.key === key){
        return column;
      }
    }
  },
  /*
   *
   */
  load: function(){
    var me = this;

    me.store.loadData();
  },
  /*
   *
   */
  save: function(){
    var me = this;

    me.store.save();
  },
  /*
   *
   */
  onWindowResize: function(){
    var me = this,
      renderTo = me.renderTo,
      el;

    if(me.panel){
      renderTo = me.panel.renderTo;

      el = Fancy.get(renderTo);
      me.setWidth(parseInt(el.width()));
    }

    me.setBodysHeight();
  },
  /*
   * @param {Number} width
   */
  setWidth: function(width){
    var me = this,
      el = me.el,
      gridBorders = me.gridBorders,
      gridWithoutPanelBorders = me.gridWithoutPanelBorders,
      panelBodyBorders = me.panelBodyBorders,
      body = me.body,
      header = me.header;

    me.scroller.scroll(0,0);

    var calcColumnsWidth = function(columns){
      var i = 0,
        iL = columns.length,
        width = 0;

      for(;i<iL;i++){
        var column = columns[i];

        if(!column.hidden){
          width += columns[i].width;
        }
      }

      return width;
    };

    var leftColumnWidth = calcColumnsWidth(me.leftColumns),
      rightColumnWidth = calcColumnsWidth(me.rightColumns),
      newCenterWidth = width - leftColumnWidth - rightColumnWidth - panelBodyBorders[1] - panelBodyBorders[3],
      gridWidth;

    if(me.wrapped){
      gridWidth = width;
      newCenterWidth = width - leftColumnWidth - rightColumnWidth;

      newCenterWidth -= gridBorders[1] + gridBorders[3];

      me.css({
        width: gridWidth
      });
    }
    else if(me.panel){
      newCenterWidth = width - leftColumnWidth - rightColumnWidth - panelBodyBorders[1] - panelBodyBorders[3];
      me.panel.el.width(width);

      newCenterWidth -= gridBorders[1] + gridBorders[3];

      gridWidth = width - panelBodyBorders[1] - panelBodyBorders[3];

      me.css({
        width: gridWidth
      });
    }
    else{
      newCenterWidth = width - leftColumnWidth - rightColumnWidth - gridWithoutPanelBorders[1] - gridWithoutPanelBorders[3];

      el.css('width', width);
    }

    if(newCenterWidth < 100){
      newCenterWidth = 100;
    }

    el.select('.' + me.centerCls).css('width', newCenterWidth);

    header.css('width', newCenterWidth);
    body.css('width', newCenterWidth);

    if(me.hasFlexColumns){
      me.reCalcColumnsWidth();
      me.columnresizer.updateColumnsWidth();
    }

    me.scroller.setScrollBars();
  },
  /*
   * @return {Number}
   */
  getWidth: function(){
    var me = this,
      value;

    if(me.panel){
      value = parseInt( me.panel.css('width') );
    }
    else{
      value = parseInt( me.css('width') );
    }

    return value;
  },
  /*
   * @return {Number}
   */
  getHeight: function () {
    var me = this,
      value;

    if(me.panel){
      value = parseInt( me.panel.css('height') );
    }
    else{
      value = parseInt( me.css('height') );
    }

    return value;
  },
  /*
   * @param {Number} value
   * @param {Number} changePanelHeight
   */
  setHeight: function(value, changePanelHeight){
    var me = this,
      gridBorders = me.gridBorders,
      panelBodyBorders = me.panelBodyBorders;

    if(me.panel && changePanelHeight !== false){
      me.panel.setHeight(value);
    }

    if(me.title){
      value -= me.titleHeight;
    }

    if(me.subTitle){
      value -= me.subTitleHeight;
    }

    if(me.footer){
      value -= me.barHeight;
    }

    if(me.bbar){
      value -= me.barHeight;
    }

    if(me.tbar){
      value -= me.barHeight;
    }

    if(me.subTBar){
      value -= me.barHeight;
    }

    if(me.buttons){
      value -= me.barHeight;
    }

    var bodyHeight = value;

    if(me.header){
      bodyHeight -= me.cellHeaderHeight;
      if(me.groupheader){
        bodyHeight -= me.cellHeaderHeight;
      }
    }

    if(me.panel){
      bodyHeight -= panelBodyBorders[0] + panelBodyBorders[2];
    }

    bodyHeight -= gridBorders[0] + gridBorders[2];

    if(me.body){
      me.body.css('height', bodyHeight);
    }

    if(me.leftBody){
      me.leftBody.css('height', bodyHeight);
    }

    if(me.rightBody){
      me.rightBody.css('height', bodyHeight);
    }

    me.el.css('height', value);
    me.height = value;

    me.scroller.update();
  },
  /*
   * @param {String} key
   * @param {*} value
   * @return {Array}
   */
  find: function(key, value){
    return this.store.find(key, value);
  },
  /*
   * @param {String} key
   * @param {*} value
   * @return {Array}
   */
  findItem: function(key, value){
    return this.store.findItem(key, value);
  },
  /*
   * @param {Function} fn
   * @param {Object} scope
   */
  each: function(fn, scope){
    this.store.each(fn, scope);
  },
  /*
   *
   */
  onActivate: function(){
    var me = this,
      doc = Fancy.get(document);

    setTimeout(function(){
      doc.on('click', me.onDeactivateClick, me);
    }, 100);
  },
  /*
   *
   */
  onDeActivate: function(){
    var me = this,
      doc = Fancy.get(document);

    me.activated = false;
    doc.un('click', me.onDeactivateClick, me);
  },
  /*
   * @param {Object} e
   */
  onDeactivateClick: function(e){
    var me = this,
      i = 0,
      iL = 20,
      parent = Fancy.get(e.target);

    for(;i<iL;i++){
      if(!parent.dom){
        return;
      }

      if(!parent.dom.tagName || parent.dom.tagName.toLocaleLowerCase() === 'body'){
        me.fire('deactivate');
        return;
      }

      if(parent.hasCls(me.widgetCls)){
        return;
      }

      parent = parent.parent();
    }
  },
  /*
   * @param {Array} keys
   * @param {Array} values
   */
  search: function(keys, values){
    var me = this;

    me.searching.search(keys, values);
  },
  /*
   *
   */
  stopSelection: function(){
    var me = this;

    if(me.selection){
      me.selection.stopSelection();
    }
  },
  /*
   * @param {Boolean} value
   */
  enableSelection: function(value){
    var me = this;

    if(me.selection){
      me.selection.enableSelection(value);
    }
  },
  /*
   * @param {String} side
   * @param {Number} index
   */
  hideColumn: function(side, index){
    var me = this,
      body = me.getBody(side),
      header = me.getHeader(side),
      columns = me.getColumns(side),
      orderIndex,
      i = 0,
      iL = columns.length,
      column,
      centerEl = me.centerEl,
      leftEl = me.leftEl,
      leftHeader = me.leftHeader,
      rightEl = me.rightEl,
      rightHeader = me.rightHeader;

    for(;i<iL;i++){
      column = columns[i];

      if(column.index === index){
        orderIndex = i;
        column.hidden = true;
        break;
      }
    }

    header.hideCell(orderIndex);
    body.hideColumn(orderIndex);

    if(me.rowedit){
      me.rowedit.hideField(orderIndex, side);
    }

    switch(side){
      case 'left':
        leftEl.css('width', parseInt(leftEl.css('width')) - column.width);
        leftHeader.css('width', parseInt(leftHeader.css('width')) - column.width);
        centerEl.css('left', parseInt(centerEl.css('left')) - column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) + column.width);
        me.body.css('width', parseInt(me.body.css('width')) + column.width);
        me.header.css('width', parseInt(me.header.css('width')) + column.width);
        break;
      case 'right':
        rightEl.css('width', parseInt(rightEl.css('width')) - column.width);
        rightHeader.css('width', parseInt(rightHeader.css('width')) - column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) + column.width);
        me.body.css('width', parseInt(me.body.css('width')) + column.width);
        me.header.css('width', parseInt(me.header.css('width')) + column.width);
        break;
    }
  },
  /*
   * @param {String} side
   * @param {Number} index
   */
  showColumn: function(side, index){
    var me = this,
      body = me.getBody(side),
      header = me.getHeader(side),
      columns = me.getColumns(side),
      orderIndex,
      i = 0,
      iL = columns.length,
      column,
      centerEl = me.centerEl,
      leftEl = me.leftEl,
      leftHeader = me.leftHeader,
      rightEl = me.rightEl,
      rightHeader = me.rightHeader;

    for(;i<iL;i++){
      column = columns[i];

      if(column.index === index){
        orderIndex = i;
        column.hidden = false;
        break;
      }
    }

    header.showCell(orderIndex);
    body.showColumn(orderIndex);

    if(me.rowedit){
      me.rowedit.showField(orderIndex, side);
    }

    switch(side){
      case 'left':
        leftEl.css('width', parseInt(leftEl.css('width')) + column.width);
        leftHeader.css('width', parseInt(leftHeader.css('width')) + column.width);
        centerEl.css('left', parseInt(centerEl.css('left')) + column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) - column.width);
        me.body.css('width', parseInt(me.body.css('width')) - column.width);
        me.header.css('width', parseInt(me.header.css('width')) - column.width);
        break;
      case 'right':
        rightEl.css('width', parseInt(rightEl.css('width')) + column.width);
        rightHeader.css('width', parseInt(rightHeader.css('width')) + column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) - column.width);
        me.body.css('width', parseInt(me.body.css('width')) - column.width);
        me.header.css('width', parseInt(me.header.css('width')) - column.width);
        break;
    }
  },
  /*
   * @param {Number} indexOrder
   * @param {String} side
   * @return {Object}
   */
  removeColumn: function(indexOrder, side){
    var me = this,
      leftEl = me.leftEl,
      leftHeader = me.leftHeader,
      leftBody = me.leftBody,
      centerEl = me.centerEl,
      body = me.body,
      header = me.header,
      rightEl = me.rightEl,
      rightBody = me.rightBody,
      rightHeader = me.rightHeader,
      column;

    switch(side){
      case 'left':
        column = me.leftColumns[indexOrder];
        me.leftColumns.splice(indexOrder, 1);
        leftHeader.removeCell(indexOrder);
        leftHeader.reSetIndexes();
        leftBody.removeColumn(indexOrder);
        leftEl.css('width', parseInt(leftEl.css('width')) - column.width);
        centerEl.css('left', parseInt(centerEl.css('left')) - column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) + column.width);
        body.css('width', parseInt(body.css('width')) + column.width);
        header.css('width', parseInt(header.css('width')) + column.width);
        break;
      case 'center':
        column = me.columns[indexOrder];
        me.columns.splice(indexOrder, 1);
        header.removeCell(indexOrder);
        header.reSetIndexes();
        body.removeColumn(indexOrder);
        break;
      case 'right':
        column = me.rightColumns[indexOrder];
        me.rightColumns.splice(indexOrder, 1);
        rightHeader.removeCell(indexOrder);
        rightHeader.reSetIndexes();
        rightBody.removeColumn(indexOrder);
        rightEl.css('right', parseInt(rightEl.css('right')) - column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) + column.width);
        header.css('width', parseInt(header.css('width')) + column.width);
        body.css('width', parseInt(body.css('width')) + column.width);
        break;
    }

    if(column.grouping){
      delete column.grouping;
    }

    if(me.summary){
      me.summary.removeColumn(indexOrder, side);
    }

    return column;
  },
  /*
   * @param {Object} column
   * @param {Number} index
   * @param {String} side
   * @param {String} fromSide
   */
  insertColumn: function(column, index, side, fromSide){
    var me = this,
      leftEl = me.leftEl,
      leftBody = me.leftBody,
      leftHeader = me.leftHeader,
      centerEl = me.centerEl,
      body = me.body,
      header = me.header,
      rightEl = me.rightEl,
      rightBody = me.rightBody,
      rightHeader = me.rightHeader;

    side = side || 'center';

    switch(side){
      case 'center':
        me.columns.splice(index, 0, column);
        header.insertCell(index, column);
        header.reSetIndexes();
        body.insertColumn(index, column);
        break;
      case 'left':
        me.leftColumns.splice(index, 0, column);
        leftHeader.insertCell(index, column);
        leftHeader.reSetIndexes();
        leftBody.insertColumn(index, column);
        leftEl.css('width', parseInt(leftEl.css('width')) + column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) - column.width);
        centerEl.css('left', parseInt(centerEl.css('left')) + column.width);
        body.el.css('width', parseInt(body.el.css('width')) - column.width);
        header.el.css('width', parseInt(header.el.css('width')) - column.width);
        break;
      case 'right':
        me.rightColumns.splice(index, 0, column);
        rightHeader.insertCell(index, column);
        rightHeader.reSetIndexes();
        rightBody.insertColumn(index, column);
        rightEl.css('width', parseInt(rightEl.css('width')) + column.width);
        centerEl.css('width', parseInt(centerEl.css('width')) - column.width);
        body.css('width', parseInt(body.css('width')) - column.width);
        header.css('width', parseInt(header.css('width')) - column.width);
        break;
    }

    if(column.menu){
      column.menu = true;
    }

    if(me.grouping){
      me.grouping.updateGroupRows();
      me.grouping.setCellsPosition(index, side);
    }

    if(column.rowEditor){
      if(side === 'left'){
        index--;
      }

      me.rowedit.moveEditor(column, index, side, fromSide);
    }

    if(me.summary){
      me.summary.insertColumn(index, side);
    }

    me.header.destroyMenus();
    me.leftHeader.destroyMenus();
    me.rightHeader.destroyMenus();
  },
  /*
   * @param {Number} orderIndex
   * @param {String} legend
   */
  disableLegend: function(orderIndex, legend){
    var me = this;

    me.columns[orderIndex].disabled = me.columns[orderIndex].disabled || {};
    me.columns[orderIndex].disabled[legend] = true;

    me.body.updateRows(undefined, orderIndex);
  },
  /*
   * @param {Number} orderIndex
   * @param {String} legend
   */
  enableLegend: function(orderIndex, legend){
    var me = this;

    me.columns[orderIndex].disabled = me.columns[orderIndex].disabled || {};
    delete me.columns[orderIndex].disabled[legend];

    me.body.updateRows(undefined, orderIndex);
  },
  /*
   *
   */
  fitHeight: function(){
    var me = this,
      s = me.store,
      panelBodyBorders = me.panelBodyBorders,
      gridBorders = me.gridBorders,
      height = s.getLength() * me.cellHeight;

    if(me.title){
      height += me.titleHeight;
    }

    if(me.tbar){
      height += me.barHeight;
    }

    if(me.bbar){
      height += me.barHeight;
    }

    if(me.buttons){
      height += me.barHeight;
    }

    if(me.subTBar){
      height += me.barHeight;
    }

    if(me.footer){
      height += me.barHeight;
    }

    if(me.header !== false){
      height += me.cellHeaderHeight;
      if(me.filter && me.filter.header){
        height += me.cellHeaderHeight;
      }
    }

    if( me.panel ){
      height += panelBodyBorders[0] + panelBodyBorders[2] + gridBorders[0] + gridBorders[2];
    }
    else{
      height += gridBorders[0] + gridBorders[2];
    }

    me.setHeight(height);
  },
  /*
   * @param {String} index
   * @param {Mixed} value
   * @param {String} sign
   */
  addFilter: function(index, value, sign){
    var me = this,
      filter = me.filter.filters[index],
      sign = sign || '';

    if(filter === undefined){
      filter = {};
    }

    if(Fancy.isDate(value)){
      var format = this.getColumnByIndex(index).format;

      filter['type'] = 'date';
      filter['format'] = format;
      value = Number(value);
    }

    if(value === ''){
      delete filter[sign];
    }
    else{
      filter[sign] = value;
    }

    me.filter.filters[index] = filter;
    me.filter.updateStoreFilters();

    me.filter.addValuesInColumnFields(index, value, sign);
  },
  /*
   * @param {String} [index]
   * @param {String} [sign]
   */
  clearFilter: function(index, sign){
    var me = this,
      s = me.store;

    if(index === undefined){
      me.filter.filters = {};
      s.filters = {};
    }
    else if(sign === undefined){
      me.filter.filters[index] = {};
      s.filters[index] = {};
    }
    else{
      if(me.filter && me.filter.filters && me.filter.filters[index] && me.filter.filters[index][sign]){
        delete me.filter.filters[index][sign];
        delete s.filters[index][sign];
      }
    }

    s.changeDataView();
    me.update();

    if(me.filter){
      me.filter.clearColumnsFields(index, sign);
    }
  },
  /*
   * @param {String} text
   */
  showLoadMask: function(text){
    this.loadmask.showLoadMask(text);
  },
  /*
   *
   */
  hideLoadMask: function(){
    this.loadmask.hideLoadMask();
  },
  /*
   *
   */
  prevPage: function(){
    this.paging.prevPage();
  },
  /*
   *
   */
  nextPage: function(){
    this.paging.nextPage();
  },
  /*
   * @param {Number} value
   */
  setPage: function(value){
    value--;
    if(value < 0){
      value = 0;
    }

    this.paging.setPage(value);
  },
  /*
   *
   */
  firstPage: function(){
    this.paging.firstPage();
  },
  /*
   *
   */
  lastPage: function(){
    this.paging.lastPage();
  },
  /*
   * @param {Number} value
   */
  setPageSize: function(value){
    this.paging.setPageSize(value);
  },
  /*
   * @return {Number}
   */
  getPage: function(){
    return this.store.showPage + 1;
  },
  /*
   * @return {Number}
   */
  getPages: function(){
    return this.store.pages;
  },
  /*
   * @return {Number}
   */
  getPageSize: function(){
    return this.store.pageSize;
  },
  /*
   *
   */
  refresh: function(){
    this.paging.refresh();
  },
  /*
   * @param {Number} x
   * @param {Number} y
   */
  scroll: function(x, y){
    var me = this,
      scroller = me.scroller;

    scroller.scroll(x, y);

    scroller.scrollBottomKnob();
    scroller.scrollRightKnob();
  },
  /*
   * @return {Array}
   */
  getDataFiltered: function(){
    return this.store.filteredData;
  },
  /*
   *
   */
  reCalcColumnsWidth: function(){
    var me = this;

    if(!me.hasFlexColumns) {
      return;
    }

    var scroller = me.scroller,
      viewWidth = me.getCenterViewWidth(),
      columns = me.columns,
      flex = 0,
      i = 0,
      iL = columns.length,
      widthForFlex = viewWidth,
      flexPerCent;

    if(me.flexScrollSensitive !== false && scroller.isRightScrollable() && !scroller.nativeScroller){
      widthForFlex -= me.bottomScrollHeight;
    }

    for(;i<iL;i++){
      var column = columns[i];

      if(column.flex){
        flex += column.flex;
      }
      else{
        widthForFlex -= column.width;
      }
    }

    if(flex === 0){
      return;
    }

    flexPerCent = widthForFlex/flex;

    i = 0;
    for(;i<iL;i++){
      var column = columns[i];

      if(column.flex){
        column.width = Math.floor(column.flex * flexPerCent);

        if(column.minWidth && column.width < column.minWidth){
          column.width = column.minWidth;
        }
        else if(column.width < me.minColumnWidth){
          column.width = me.minColumnWidth;
        }
      }
    }
  },
  /*
   * @return {Array}
   */
  getDisplayedData: function(){
    var me = this,
      viewTotal = me.getViewTotal(),
      data = [],
      i = 0,
      leftColumns = me.leftColumns,
      columns = me.columns,
      rightColumns = me.rightColumns;

    for(;i<viewTotal;i++){
      var rowData = [];

      Fancy.each(leftColumns, function(column){
        if(column.index === undefined){
          return;
        }
        rowData.push(me.get(i, column.index));
      });

      Fancy.each(columns, function(column){
        if(column.index === undefined){
          return;
        }
        rowData.push(me.get(i, column.index));
      });

      Fancy.each(rightColumns, function(column){
        if(column.index === undefined){
          return;
        }
        rowData.push(me.get(i, column.index));
      });

      data.push(rowData);
    }

    return data;
  },
  /*
   *
   */
  exportToExcel: function(){
    var me = this;

    if(me.exporter){
      me.exporter.exportToExcel();
    }
  }
});