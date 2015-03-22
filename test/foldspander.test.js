var _ = require('lodash');
var mocha = require('mocha');
var should = require('should');
var Foldspander = require(__dirname + '/../');
var matchers = Foldspander.matchers;
var folders = Foldspander.folders;
var expanders = Foldspander.expanders;

// Generic Test Class
var Fraction = function(a, b) {
  this.numerator = a;
  this.denominator = b;
};

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

    it('should fold and expand a simple object', function() {
      var obj = {a: 1, b: 2};
      foldnexpand(obj).should.eql(obj).and.not.equal(obj);
    });

    it('should fold and expand an array', function() {
      var arr = [1,2,3];
      foldnexpand(arr).should.eql(arr).and.not.equal(arr);
    });

    it('should fold and expand a deep nested object', function() {
      var obj = {a: [1,2, {value: true}], b: {values: [{a: false}]}};
      foldnexpand(obj).should.eql(obj).and.not.equal(obj);
    });

    it('should throw a TypeError when adding an already existing matcher', function() {
      foldspander.add('custom_property', function() {}, function() {}, function() {});
      (function() {
        foldspander.add('custom_property');
      }).should.throw(TypeError);
    });

    describe('native', function() {

      beforeEach(function() {
        foldspander.native(true);
      });

      it('should fold and expand a Date', function() {
        var date = new Date();
        foldnexpand(date).valueOf().should.eql(date.valueOf());
      });

      it('should fold and expand a Regexp', function() {
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

      it('should fold and expand NaN', function() {
        var nan = foldnexpand(NaN);
        ((typeof nan === 'number') && isNaN(nan)).should.equal(true);
      });

      it('should fold and expand Infinity and -Infinity', function() {
        foldnexpand(Infinity).should.equal(Infinity);
        foldnexpand(-Infinity).should.equal(-Infinity);
      });

    });

    describe('expand', function() {

      beforeEach(function() {
        foldspander.native(true);
      });

      it('should ignore a registered type', function() {
        var date = new Date();
        foldspander.expand(date).should.eql(date);
      });
    
    });

    describe('matcher "instanceof"', function() {

      beforeEach(function() {
        foldspander.add('object_fraction', matchers.instanceof(Fraction),
          function(obj) { return {numerator: obj.numerator, denominator: obj.denominator}; },
          function(obj) { return new Fraction(obj.numerator, obj.denominator); }
        );
      });

      it('should fold and expand the object', function() {
        var obj = new Fraction(5, 2);
        var fld = foldspander.fold(obj);
        var exp = foldspander.expand(fld);
        exp.should.be.instanceof(Fraction).and.not.equal(obj).and.containDeep({
          numerator: obj.numerator,
          denominator: obj.denominator
        });
      });
    
    });

    describe('folder "pick"', function() {

      beforeEach(function() {
        foldspander.add('object_fraction', matchers.instanceof(Fraction),
          ['numerator', 'denominator'], // these properties will be picked from the object
          function(obj) { return new Fraction(obj.numerator, obj.denominator); }
        );
      });

      it('should fold and expand the object', function() {
        var obj = new Fraction(10, 4);
        var fld = foldspander.fold(obj);
        var exp = foldspander.expand(fld);
        exp.should.be.instanceof(Fraction).and.not.equal(obj).and.containDeep({
          numerator: obj.numerator,
          denominator: obj.denominator
        });
      });
    
    });

    describe('expander "construct"', function() {

      beforeEach(function() {
        foldspander.add('object_fraction', matchers.instanceof(Fraction),
          function(obj) { return {numerator: obj.numerator, denominator: obj.denominator}; },
          expanders.construct(Fraction, ['numerator', 'denominator'])
        );
      });

      it('should fold and expand the object', function() {
        var obj = new Fraction(9, 3);
        var fld = foldspander.fold(obj);
        var exp = foldspander.expand(fld);
        exp.should.be.instanceof(Fraction).and.not.equal(obj).and.containDeep({
          numerator: obj.numerator,
          denominator: obj.denominator
        });
      });

    });

    describe('option "descend"', function() {

      it('should prevent recursing when walking', function() {
        foldspander.native(true);
        foldspander.options.descend = _.constant(false);
        var obj = {a: new Date(), b: {c: new Date()}};
        var fld = foldspander.fold(obj);
        // we did not descend at all so the fold is equal to the starting object
        fld.should.eql(obj).and.not.equal(obj);
      });
    
    });

    describe('option "token"', function() {

      beforeEach(function() {
        foldspander.native(true);
        foldspander.options.token = '@';
      });

      it('should change the token when folding', function() {
        var obj = {a: new Date()};
        var fld = foldspander.fold(obj);
        fld.a.should.eql({'@name': 'native_date', timestamp: obj.a.valueOf()});
      });

      it('should seamlessly fold and expand', function() {
        var obj = {a: new Date()};
        foldnexpand(obj).should.eql(obj).and.not.equal(obj);
      });
    
    });

    describe('option "native"', function() {

      beforeEach(function() {
        foldspander = new Foldspander({native: true});
      });

      it('should fold and expand native options immediately', function() {
        var obj = {a: new Date(), r: /adsf/i};
        foldnexpand(obj).should.eql(obj).and.not.equal(obj);
      });
    
    });

    describe('parse and stringify', function() {

      beforeEach(function() {
        foldspander.native(true);
      });

      it('should stringify and parse a complex object into identical versions', function() {
        var obj = {date: new Date(), regexp: /asdf/i};
        var str = foldspander.stringify(obj);
        var exp = foldspander.parse(str);
        exp.should.eql(obj).and.not.equal(obj);
      });
    
    });

    describe('getReplacer and getReviver', function() {

      beforeEach(function() {
        foldspander.native(true);
      });

      it('should get correct replacer and reviver functions to stringify and parse a object', function() {
        var obj = {date: new Date(), regexp: /asdf/i, nest: {value: new Date(), arr: [1,2, new Date()]}};
        var str = JSON.stringify(obj, foldspander.getReplacer());
        var exp = JSON.parse(str, foldspander.getReviver());
        exp.should.eql(obj).and.not.equal(obj);
      });
    
    });
  
  });

});
