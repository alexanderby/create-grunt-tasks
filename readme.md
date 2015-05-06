# create-grunt-tasks

> Create Grunt tasks as a chain of sub-tasks

This module simplifies Grunt tasks creation and increases code readability and maintainability by eliminating the configuration mess.


## Install

```
$ npm install create-grunt-tasks --save-dev
```


## Usage

Method `sub()` can be used to configure a **plug-in**, set a **task function** or include **another task**.
Finally `gruntfile.js` may look like this:

```js
module.exports = function (grunt) {
    require('create-grunt-tasks')(grunt, function(create) {
    
        create.task('task1')                        // Create task "task1":
            .sub(function () { /* action */ })      // configure task function,
            .sub('plugin1', { /* options */});      // configure plug-in "plugin1".
            
        create.task('task2')                        // Create task "task2":
            .sub('plugin1', { /* options */})       // configure plug-in "plugin1",
            .sub('plugin2', { /* options */});      // configure plug-in "plugin2".
            .sub('plugin1', { /* options */});      // configure "plugin1" again.
            
        create.task('complexTask')                  // Create task "complexTask":
            .sub('task1')                           // include task "task1",
            .sub('task2');                          // include task "task2".
            
    });
);
```

There is no need to call `grunt.loadNpmTasks()` as far as plug-in tasks are loaded using the [load-grunt-tasks](https://www.npmjs.com/package/load-grunt-tasks) module.
As soon as arguments are passed to **create-grunt-tasks** module it internally calls `grunt.initConfig()` and `grunt.registerTask()` methods.

Now run the created "complexTask" in the console:
```
$ grunt complexTask
```


## Example

```js
// Gruntfile.js
module.exports = function (grunt) {
    require('create-grunt-tasks')(grunt, function (create) {
    
        //-------------
        // RELEASE task
        //-------------
        
        create.task('release')
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
            // Copy HTML
            
            .sub('copy', {
                src: 'src/index.html', 
                dest: 'build/' 
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
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
                src: 'src/index.html', 
                dest: 'build/' 
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

    //-------------
    // RELEASE task
    //-------------
    
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


## Changelog

##### 0.7.0
- Pass function to `sub()` method for registering a task function.
- Pass task name to `sub()` method to include another task.
- `other()` method is obsolete.

##### 0.6.2
- Added `other(taskName)` method to register tasks that contain another tasks.

##### 0.5.0
- Released.
