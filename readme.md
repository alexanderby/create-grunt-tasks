# create-grunt-tasks

> Create Grunt tasks as a chain of sub-tasks

This module simplifies Grunt tasks creation and increases code readability and maintainability by eliminating the configuration mess.


## Install

```
$ npm install create-grunt-tasks --save-dev
```


## Usage

Load module:
```
var createTasks = require('create-grunt-tasks');
```

Start tasks registration:
```
module.exports = function (grunt) {
    createTasks(grunt, function(create) {
```

Here `create` is an instance of `TaskRegistrar` class.
Now create task "taskName":
```
        var task = create.task('taskName');
```

Method `task(taskName)` starts composing single task configuration. It returns an instance of `SubTaskRegistrar`.
Now we add a sub-task, which uses plug-in "pluginName".:
```
        task.sub('pluginName', { /* plug-in options */ });
```

Method `sub()` returns `SubTaskRegistrar` itself, so it is possible to add multiple sub-tasks:
```
        task.sub('pluginName', { /* plug-in options */ })
		    .sub('otherPlugin', { /* other plug-in options */ });
```

It is also possible to pass another task name by using the `other(taskName)` method:
```
        complexTask
		    .other('task1')
		    .other('task2');
```

Finally `gruntfile.js` may look like this:
```
module.exports = function (grunt) {
    require('create-grunt-tasks')(grunt, function(create) {
	
	    create.task('task1')
		    .sub('plugin1', { /* options */})
		    .sub('plugin2', { /* options */})
		    .sub('plugin1', { /* options */});
			
	    create.task('task2')
		    .sub('plugin1', { /* options */})
		    .sub('plugin2', { /* options */});
			
		create.task('complexTask')
			.other('task1')
			.other('task2');
			
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
		    .other('debug-js')
			.other('debug-css');
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

##### 0.6.0
- Added `other(taskName)` method for registering tasks that contain another tasks.

##### 0.5.0
- Released.
