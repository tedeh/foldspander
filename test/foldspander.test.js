var mocha = require('mocha');
var should = require('should');
var Foldspander = require(__dirname + '/../');

describe('Foldspander', function() {

  it('should return an instance of itself when called as a function', function() {
    Foldspander().should.be.instanceof(Foldspander);
  });

  describe('instance', function() {

    var foldspander = null;
    var foldnexpand = null; // helper function that folds and expands the same object and returns it

    beforeEach(function() {
      foldspander = new Foldspander();

      foldnexpand = function(obj) {
        var fold = foldspander.fold(obj);
        return foldspander.expand(fold);
      };

    });

    it('should have some default options', function() {
      foldspander.should.have.property('options').containDeep({
        token: '$',
        native: false
      });
    });

    it('should foldspand a simple object', function() {
      var obj = {a: 1, b: 2};
      foldnexpand(obj).should.eql(obj).and.not.equal(obj);
    });

    it('should foldspand an array', function() {
      var arr = [1,2,3];
      foldnexpand(arr).should.eql(arr).and.not.equal(arr);
    });

    describe('native objects', function() {

      beforeEach(function() {
        foldspander.native(true);
      });

      it('should foldspand a Date', function() {
        var date = new Date();
        foldnexpand(date).valueOf().should.eql(date.valueOf());
      });

      it('should foldspand a Regexp', function() {
        var source = '\d';
        var regexp = new RegExp(source, 'gim');
        var expanded = foldnexpand(regexp);
        expanded.should.containDeep({
          source: source,
          multiline: true,
          ignoreCase: true,
          global: true
        });
      });

      it('should foldspand NaN', function() {
        var nan = foldnexpand(NaN);
        ((typeof nan === 'number') && isNaN(nan)).should.equal(true);
      });

      it('should foldspand Infinity and -Infinity', function() {
        foldnexpand(Infinity).should.equal(Infinity);
        foldnexpand(-Infinity).should.equal(-Infinity);
      });
    
    });
  
  });

});
