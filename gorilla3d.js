// Classes
var Gorilla3D = {};
Gorilla3D.Storage = function () {
    this.storageDomain = location.hostname;
    if (this.storageDomain === "localhost") {
        this.storageDomain += ".localdomain";
    }
    this.store = false;
    if (typeof localStorage !== 'undefined') {
        this.store = localStorage;
        this.getItem = function (key, func) {
            func(this.store.getItem(key));
        };
        this.setItem = function (key, value) {
            this.store.setItem(key, value);
            return this;
        };
        this.removeItem = function (key) {
            this.store.removeItem(key);
            return this;
        };
    } else if (typeof globalStorage !== 'undefined') {
        this.store = globalStorage[this.storageDomain];
        this.setItem = function (key, value) {
            this.store[key] = value;
            return this;
        };
        this.getItem = function (key, func) {
            func(this.store[key]);
        };
        this.removeItem = function (key) {
            delete this.store[key];
            return this;
        };
    } else if (typeof window.openDatabase !== 'undefined') {
        // Safari 3.1 & 3.2
        this.store = openDatabase(this.storageDomain, '1.0', "G3D Storage Alternative", 200000);
        if (!this.store) {
            alert('unable to open database');
        }
        // Create the Database
        this.store.transaction(function (tx) {
            tx.executeSql(
                'SELECT COUNT(*) FROM storage', [], function (result) {}, 
                function (tx, error) {
                    // Create Database
                    var sql = 'CREATE TABLE storage (' +
                          'storage_key VARCHAR(255) UNIQUE,' +
                          'storage_value TEXT' +
                        ')';
                    tx.executeSql(sql, [], function (result) {});
                }
            );
        });    
        this.setItem = function (key, value) {
            var exists = false;
            
            this.store.transaction(function (tx) {
                // See if the key exists
                var sql = 'SELECT storage_key FROM storage WHERE storage_key = ?';
                tx.executeSql(sql, [key], function (tx, result) {
                    if (result.rows.length > 0) {
                        exists = true;
                    }
                    // Toggle between an update / insert
                    if (exists !== true) {
                        sql = 'INSERT INTO storage (storage_key, storage_value) VALUES(?, ?)';
                        tx.executeSql(sql, [key, value], function (tx, result) {}, function (tx, error) {
                            alert('INSERT ERROR: ' + error.message);
                        });
                    } else {
                        sql = 'UPDATE storage SET storage_value = ? WHERE storage_key = ?';
                        tx.executeSql(sql, [value, key], function (tx, result) {}, function (tx, error) {
                            alert('UPDATE ERROR: ' + error.message);
                        });
                    }
                });
            });
            return this;
        };
        this.getItem = function (key, func) {
            var sql = 'SELECT storage_value FROM storage WHERE storage_key = ?';
            this.store.transaction(function (tx) {
                tx.executeSql(sql, [key], function (tx, result) {
                    if (result.rows.length > 0) {
                        func(result.rows.item(0).storage_value);
                    }
                }, function (tx, error) {
                    alert('GET ERROR: ' + error.message);
                });
            });
            return this;
        };
        this.removeItem = function (key) {
            var sql = 'DELETE FROM storage WHERE storage_key = ?';
            this.store.transaction(function (tx) {
                tx.executeSql(sql, [key], function (tx, result) {
                    if (result.rows.length > 0) {
                        func(result.rows.item(0).storage_value);
                    }
                }, function (tx, error) {
                    alert('GET ERROR: ' + error.message);
                });
            });
            return this;
        };
    } else if (window.google && google.gears) {
        // Gears / Chrome Support
        this.store = google.gears.factory.create('beta.database');
        this.store.open(this.storageDomain);
        // Create the Database
        var sql = 'CREATE TABLE IF NOT EXISTS storage (' +
              'storage_key VARCHAR(255) UNIQUE,' +
              'storage_value TEXT' +
            ')';
        this.store.execute(sql); 
        
        this.setItem = function (key, value) {
            // See if the key exists
            var sql = 'SELECT storage_key FROM storage WHERE storage_key = ?',
                result = this.store.execute(sql, [key]),
                exists = result.isValidRow();
            result.close();
            
            // Toggle between an update / insert
            if (exists !== true) {
                sql = 'INSERT INTO storage (storage_key, storage_value) VALUES(?, ?)';
                this.store.execute(sql, [key, value]);
            } else {
                sql = 'UPDATE storage SET storage_value = ? WHERE storage_key = ?';
                this.store.execute(sql, [value, key]);
            }
            return this;
        };
        this.getItem = function (key, func) {
            var sql = 'SELECT storage_value FROM storage WHERE storage_key = ?',
                result = this.store.execute(sql, [key]);
            if (result.isValidRow()) {
                func(result.field(0));
            }
            result.close();
            return this;
        };
        this.removeItem = function (key) {
            var sql = 'DELETE FROM storage WHERE storage_key = ?',
            result = this.store.execute(sql, [key]);
            result.close();
            return this;
        };
    } else {
        // TODO: tell them they can't use this webapp
    }
};
