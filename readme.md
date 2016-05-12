# create-grunt-tasks

> Create Grunt tasks as a chain of sub-tasks

This module simplifies Grunt tasks creation and increases code readability and maintainability by eliminating the configuration mess.


## Install

```
$ npm install create-grunt-tasks --save-dev
```


## Usage

Start creating tasks by calling `task()` or `tasks()` methods.
Method `sub()` can be used to configure a **plug-in**, set a **task function** or include **another task**.
While creating multiple tasks, use `for()`, `not()` methods or pass factory function to `sub()` method for tuning tasks configuration.

Finally `Gruntfile.js` may look like this:

```js
module.exports = function (grunt) {
    require('create-grunt-tasks')(grunt, function (create) {
    
        create.task('task1')                        // Create task "task1":
            .sub(function () { /* action */ })      // configure task function,
            .sub('plugin1', { /* options */ });     // configure plug-in "plugin1".
            
        create.tasks(['task2', 'task3', 'task4'])   // Create multiple tasks:
            .sub('plugin1', { /* options */ })      // same config for both tasks,
            .sub('plugin2', function (task) {
                var options = { /* options */ };
                if (task === 'task3') {             // configure specific options
                    options.prop = 'specific';      // for task "task3".
                }
                return options;
            })
            .for(                                   // Configure plug-in for
                ['task2', 'task4'],                 // "task2" and 'task4".
                'plugin3', { /* options */ }
            )
            .not(                                   // Configure plug-in
                'task2',                            // for all but "task2".
                'plugin1', { /* options */ }
            );
            
        create.task('complex-task')                 // Create task "complex-task":
            .sub('task1')                           // include task "task1",
            .sub('task2');                          // include task "task2".
            
    });
);
```

There is no need to call `grunt.loadNpmTasks()` as far as plug-in tasks are loaded using the [load-grunt-tasks](https://www.npmjs.com/package/load-grunt-tasks) module.
As soon as arguments are passed to **create-grunt-tasks** module it internally calls `grunt.initConfig()` and `grunt.registerTask()` methods.

Now run the created "complex-task" in the console:
```
$ grunt complex-task
```


## Example

```js
// Gruntfile.js
module.exports = function (grunt) {
    require('create-grunt-tasks')(grunt, function (create) {
    
        //--------------
        // RELEASE tasks
        //--------------
        
        create.tasks(['release', 'release-japan'])
            
            //
            // Copy HTML
            // (optionally edit content)
            
            .sub('copy', function (task) {                
                var config = {
                    src: 'src/index.html',
                    dest: 'build/'
                };
                if (task === 'release-japan') {
                    config.options = {
                        process: function (content) {
                            return content.replace('hello', 'konichiwa');
                        }
                    };
                }
                return config;
            })
            
            //
            // Compile TypeScript and move typing
            
            .sub('typescript', {
                src: 'src/index.ts',
                dest: 'build/index.js',
                options: { module: 'amd', target: 'es5', declaration: true }
            })
            .sub('copy', {
                src: 'build/index.d.ts', 
                dest: 'build/typing/' 
            })
            .sub('clean', ['build/index.d.ts'])
            
            //
            // Compile LESS
            
            .sub('less', {
                files: {
                    'build/style/style.css': 'src/style/style.less'
                },
                options: { paths: ['src/style/'] }
            })
            .sub('cssmin', {
                files: { 'build/style/style.css': ['build/style/style.css'] }
            })
            
            //
            // Start server
            
            .sub(function () {
                var done = this.async();
                require('http').createServer(function (req, res) {
                    res.end('Ready');
                    done();
                }).listen(1234);
            });
            
        //------------
        // DEBUG tasks
        //------------
        
        // Compile TypeScript
        create.task('debug-js')
            .sub('typescript', {
                src: 'src/index.ts',
                options: { target: 'es5', sourceMap: true }
            });
            
        // Compile LESS
        create.task('debug-css')
            .sub('less', {
                files: {
                    'src/style/style.css': 'src/style/style.less'
                },
                options: { paths: ['src/style/'] }
            });
            
        // Compile both TypeScript and LESS
        create.task('debug')
            .sub('debug-js')
            .sub('debug-css');
    });
}
```

This is equivalent to:

```js
// Gruntfile.js
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');      // Add this for every
    grunt.loadNpmTasks('grunt-contrib-clean');     // newly installed plug-in :(
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            movedTyping: ['build/index.d.ts']
        },
        copy: {
            typing: {
                src: 'build/index.d.ts', 
                dest: 'build/typing/' 
            },
            html: {
                src: 'src/index.html',             // Some options...
                dest: 'build/' 
            },
            htmlJapan: {
                src: 'src/index.html',             // are repeated :(
                dest: 'build/',
                options: {
                    process: function (content) {
                        return content.replace('hello', 'konichiwa');
                    }
                }
            }
        },
        cssmin: {
            release: {
                files: { 'build/style/style.css': ['build/style/style.css'] }
            }
        },
        less: {
            release: {
                files: {
                    'build/style/style.css': 'src/style/style.less'
                },
                options: { paths: ['src/style/'] }
            },
            debug: {
                files: {
                    'src/style/style.css': 'src/style/style.less'
                },
                options: { paths: ['src/style/'] }
            }
        }
        typescript: {
            release: {
                src: 'src/index.ts',
                dest: 'build/index.js',
                options: { module: 'amd', target: 'es5', declaration: true }
            }
            debug: {
                src: 'src/index.ts',
                dest: 'build/index.js',
                options: { module: 'amd', target: 'es5', sourceMap: true }
            }
        }
    });
    
    grunt.registerTask('server-start', function () {
        var done = this.async();
        require('http').createServer(function (req, res) {
            res.end('Ready');
            done();
        }).listen(1234);
    });

    //--------------
    // RELEASE tasks
    //--------------
    
    grunt.registerTask('release', [
        // Compile TypeScript and move typing
        'typescript:release',
        'copy:typing',
        'clean:movedTyping',
        
        // Compile LESS
        'less:release',
        'cssmin:release',

        // Copy HTML
        'copy:html'
        
        // Start server
        'server-start'
    ]);
    
    grunt.registerTask('release-japan', [
        // Compile TypeScript and move typing
        'typescript:release',
        'copy:typing',                    // Absolutely the same config
        'clean:movedTyping',              // as for previous task...
        
        // Compile LESS
        'less:release',
        'cssmin:release',

        // Copy HTML and edit content
        'copy:htmlJapan'                  // the difference in one line :(
        
        // Start server
        'server-start'                    // Need to search for configuration
    ]);                                   // in another place :(
    
    //------------
    // DEBUG tasks
    //------------
    
    // Compile TypeScript
    grunt.registerTask('debug-js', [
        'typescript:debug'
    ]);
    
    // Compile LESS
    grunt.registerTask('debug-css', [
        'less:debug'
    ]);
    
    // Compile both TypeScript and LESS
    grunt.registerTask('debug', [
        'debug-js',
        'debug-css'
    ]);
}
```

Does your Gruntfile look like this mess? Then use `create-grunt-tasks` plug-in to clean it up.


## Changelog

##### 0.8.0
- Register multiple tasks using `tasks()` method.
- Pass factory function to `sub()` method for customizing plug-in options depending on task.
- Added `for()` method for configuring optional sub-task for specified tasks.
- Added `not()` method for configuring optional sub-task for all tasks excluding specified.

##### 0.7.1
- Pass function to `sub()` method for registering a task function.
- Pass task name to `sub()` method to include another task.
- `other()` method is obsolete.

##### 0.6.2
- Added `other(taskName)` method for registering tasks that contain other tasks.

##### 0.5.0
- Released.
