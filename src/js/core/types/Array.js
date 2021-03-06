Fancy.Array = {
  copy: function(a, deep){
    if(!deep) {
      return a.slice();
    }

    var newArray = [],
      i = 0,
      iL = a.length;

    for(;i<iL;i++){

      switch(Fancy.typeOf(a[i])){
        case 'object':
          newArray[i] = Fancy.Object.copy(a[i]);
          break;
        case 'array':
          newArray[i] = Fancy.Array.copy(a[i]);
          break;
        default:
          newArray = a[i];
      }
    }

    return newArray;
  },
  each: function(arr, fn){
    var i = 0,
      iL = arr.length;

    for(;i<iL;i++){
      fn(arr[i], i);
    }
  },
  /*
   * @param {Array} values
   * @return {Number}
   */
  count: function(values){
    return values.length;
  },
  /*
   * @param {Array} values
   * @return {Number}
   */
  sum: function(values){
    var i = 0,
      iL = values.length,
      value = 0;

    if(Fancy.isArray(values[0])){
      value = [];
      for (;i<iL;i++){
        var j = 0,
          jL = values[i].length;

        for(;j<jL;j++){
          if(value[j] === undefined){
            value[j] = 0;
          }

          value[j] += values[i][j];
        }
      }
    }
    else {
      for (; i < iL; i++) {
        value += values[i];
      }
    }

    return value;
  },
  /*
   * @param {Array} values
   * @return {Number}
   */
  min: function(values){
    return Math.min.apply(this, values);
  },
  /*
   * @param {Array} values
   * @return {Number}
   */
  max: function(values){
    return Math.max.apply(this, values);
  }
};