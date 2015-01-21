install:
	cd contrib/rethinkdb; npm install
	cd contrib/rethinkdb-co; npm install
	cd contrib/redis; npm install
	cd contrib/redis-co; npm install
	cd contrib/mongodb; npm install
	cd contrib/rabbitmq; npm install
	npm install

.PHONY: install
