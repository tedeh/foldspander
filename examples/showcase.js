var Foldspander = require(__dirname + '/../');
var should = require('should');

// Basic Class
function Fraction(numerator, denominator) {
  this.numerator = numerator;
  this.denominator = denominator;
};

var foldspand = new Foldspander({

  // option that indicates that we want to have automatic support for some native Javascript types
  native: true
  
});

// add Fraction as a foldspander type
foldspand.add(

  // handle that should be unique
  'fraction',

  // helper method that matches if an object is instanceof Fraction
  Foldspander.matchers.instanceof(Fraction),
  
  // folds the object (breaks it into a basic JSON type)
  function(frac) { return {numerator: frac.numerator, denominator: frac.denominator}; },
  
  // expands the object (instantiates the complex type)
  function(obj) { return new Fraction(obj.numerator, obj.denominator); }
  
);

var objs = [
  {id: 1, value: new Fraction(1,3), created_at: new Date('2015-03-23')},
  {id: 2, value: new Fraction(1,7), created_at: new Date('2015-03-24')}
];

// get a string of JSON from the list of objects
var str = foldspand.stringify(objs);

// parse the string and instantiate the contained objects
var exp = foldspand.parse(str);

// objs are equal to exp
exp.should.eql(objs);

// more verbose example to show that complex objects have indeed been instantiated
exp[0].value.should.be.instanceof(Fraction);
exp[1].created_at.should.be.instanceof(Date);
