# create-grunt-tasks

> Create Grunt tasks as a chain of sub-tasks

This module simplifies task creation by eliminating the configuration mess. Grunt tasks are loaded using the [load-grunt-tasks](https://www.npmjs.com/package/load-grunt-tasks) module.


## Install

```
$ npm install create-grunt-tasks --save-dev
```


## Example

```js
// Gruntfile.js
module.exports = function (grunt) {
    require('create-grunt-tasks')(grunt, function (create) {
        create.task('build')
            // Compile TypeScript and move typing
            .sub('typescript', {
                src: 'src/index.ts',
                dest: 'build/index.js',
                options: { module: 'amd', target: 'es5', declaration: true }
            })
            .sub('copy', {
                expand: true, flatten: true, 
                src: 'build/index.d.ts', 
                dest: 'build/typing/' 
            })
            .sub('clean', ['build/index.d.ts'])
            // Copy HTML
            .sub('copy', {
                expand: true, flatten: true, 
                src: 'src/index.html', 
                dest: 'build/' 
            });
    });
}
```

This is equivalent to

```js
// Gruntfile.js
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-copy');
    grunt.loadNpmTasks('grunt-clean');
    grunt.loadNpmTasks('grunt-typescript');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            movedTyping: ['build/index.d.ts']
        },
        copy: {
            typing: {
                expand: true, flatten: true, 
                src: 'build/index.d.ts', 
                dest: 'build/typing/' 
            },
            html: {
                expand: true, flatten: true, 
                src: 'src/index.html', 
                dest: 'build/' 
            }
        },
        typescript: {
            compile: {
                src: 'src/index.ts',
                dest: 'build/index.js',
                options: { module: 'amd', target: 'es5', declaration: true }
            }
        }
    });

    grunt.registerTask('build', [
        'typescript:compile',
        'copy:typing',
        'clean:movedTyping',

        'copy:html'
    ]);
}
```
