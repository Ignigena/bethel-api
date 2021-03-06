/**
 * Location
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	title: 'string',
  	address: 'string',
  	uid: 'integer',
  	loc: 'array',
  	org: {
      model: 'org'
    }
    
  }

};
