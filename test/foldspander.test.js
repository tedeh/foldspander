var _ = require('lodash');
var mocha = require('mocha');
var should = require('should');
var Foldspander = require(__dirname + '/../');
var matchers = Foldspander.matchers;
var folders = Foldspander.folders;
var expanders = Foldspander.expanders;

// Generic Test Class
function Fraction(a, b) {
  this.numerator = a;
  this.denominator = b;
};

// Generic Model Class
function Model(attrs) {
  this.attributes = attrs || {};
}

// Generic nested Class (Collection of Models)
function Collection() {
  this.models = _.flatten(arguments);
}

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

    describe('fold', function() {

      it('should ignore a non-registered type', function() {
        var date = new Date();
        foldspander.fold(date).should.eql(date);
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

      describe('native function', function() {

        it('should toggle with the "native" function', function() {
          var date = new Date();
          foldspander.native(false);
          foldspander.fold(date).should.be.instanceof(Date);
          foldspander.native(true);
          foldspander.fold(date).should.have.property('timestamp', date.valueOf());
        });

        it('should limit native functions to an array if given one', function() {
          var obj = {d: new Date(), r: /asdf/i};
          foldspander.native(['Date']);
          foldspander.fold(obj).should.containDeep({d: {timestamp: obj.d.valueOf()}, r: obj.r});
        });
      
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

      var stringify = null;
      var parse = null;

      beforeEach(function() {
        foldspander.native(true);
        stringify = _.partial(JSON.stringify, _, foldspander.getReplacer());
        parse = _.partial(JSON.parse, _, foldspander.getReviver());
      });

      it('should get correct replacer and reviver functions to stringify and parse a object', function() {
        var obj = {date: new Date(), regexp: /asdf/i, nest: {value: new Date(), arr: [1,2, new Date()]}};
        var exp = parse(stringify(obj));
        exp.should.eql(obj).and.not.equal(obj);
      });

      it('should revive and replace a complex array', function() {
        var obj = [{a: 1}, {b: 2}, {c: new Date()}];
        var exp = parse(stringify(obj));
        exp.should.eql(obj).and.not.equal(obj);
      });
    
    });

    describe('nested objects', function() {

      beforeEach(function() {
        foldspander.native(true);
        foldspander.add('model', matchers.instanceof(Model),
          function(model) { return {attributes: model.attributes}; },
          function(obj) { return new Model(obj.attributes); }
        );
        foldspander.add('collection', matchers.instanceof(Collection),
          function(collection) { return {models: collection.models}; },
          function(obj) { return new Collection(obj.models); }
        );
      });

      it('should descend into a nested object', function() {

        var org = new Collection([
          new Model({id: 1, created_at: new Date()}),
          new Model({id: 2, created_at: new Date()})
        ]);

        var fold = foldspander.fold(org);
        fold.models[0].should.not.be.instanceof(Model); // has descended correctly
        fold.models[0].attributes.created_at.should.not.be.instanceof(Date);

        var exp = foldspander.expand(fold);

        exp.models[0].should.not.be.equal(org.models[0]); // has descended correctly
        exp.models[1].attributes.created_at.should.not.be.equal(org.models[1].attributes.created_at);
        exp.should.eql(org).and.not.equal(org); // is the same object
      });
    
    });

    describe('helper addClass', function() {

      beforeEach(function() {
        foldspander.addClass(Fraction);
      });

      it('should throw an error if a class has no name', function() {
        var f = function(a, b) { this.a = a; this.b = b; };
        (function() { foldspander.addClass(f); }).should.throw();
      });

      it('should match and fold and expand an instance', function() {
        var obj = new Fraction(5, 9);
        foldnexpand(obj).should.eql(obj).and.not.equal(obj);
      });
    
    });
  
  });

});
