var Foldspander = require(__dirname + '/../');
var should = require('should');

function Fraction(numerator, denominator) {
  this.numerator = numerator;
  this.denominator = denominator;
};

var foldspander = new Foldspander();

foldspander.addClass(Fraction);

var obj = new Fraction(1,3);

// 1) Every enumerable property was picked of obj
var fld = foldspander.fold(obj);

// 2) Fraction was instantiated with no arguments to the constructor
// 3) Every property picked in 1) was copied into instance from 2)
var exp = foldspander.expand(fld);

exp.should.eql(obj).and.not.equal(obj);
