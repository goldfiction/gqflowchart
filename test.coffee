app=require './app.coffee'
assert=require 'assert'
tests=require 'gqtest'

it=tests.it
run=tests.doRun

# dummy test for code integrity
it "should be able to run",(done)->
  done()

it "should be able to get abc",(done)->
  assert.equal app.abc,"abc"
  done()

run()