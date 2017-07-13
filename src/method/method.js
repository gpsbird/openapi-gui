Vue.component('api-method', {
	props: ['method', 'index', 'maintags'],
	data: function() {
		return {
            visible: false,
            schemaEditor: undefined
        }
	},
    methods: {
		specLink: function(fragment) {
			return this.$parent.$parent.specLink(fragment);
		},
		markdownPreview: function() {
			this.$parent.$parent.markdownPreview('#'+this.descId);
		},
        toggleBody : function() {
            this.visible = !this.visible;
            //$(this.hashUid).collapse('toggle');
            if (this.visible) {
                Vue.nextTick(function(){
                    this.tagSetup();
                },this);
            }
        },
		selectTab: function (name, $event) {
			$('.method-tab').removeClass('is-active');
			$('.tabItem-method-'+name).addClass('is-active');
			$('.method-pane').addClass('hidden');
			$('.method-pane-'+name).removeClass('hidden');
			$event.preventDefault();
		},
        addOperation : function() {
            this.$parent.addOperation();
        },
        duplicateOperation : function(method) {
            this.$parent.addOperation(method);
        },
		removeOperation : function(target) {
            this.$parent.removeOperation(target);
	    },
        addParameter : function() {
            var newParam = {};
            newParam.name = 'newParam';
            newParam.in = 'query';
            newParam.required = false;
            newParam.schema = {};
            newParam.schema.type = 'string';
            this.method.parameters.push(newParam);
        },
        removeParameter : function(index) {
            this.$root.save();
            this.method.parameters.splice(index,1);
        },
        addResponse : function() {
            var status = 200;
            while (this.method.responses[status]) {
                status++;
            }
            var response = {};
            response.description = 'Description';
            Vue.set(this.method.responses, status, response);
        },
        tagSetup : function() {
            var simpleTags = [];
            for (var t in this.maintags) {
                simpleTags.push(this.maintags[t].name);
            }
            $(this.hashTagId).tagsinput({
                typeahead: {
                    name: this.tagId,
                    source: function(query) {
                        return simpleTags;
                    }
                }
            });
            for (var t in this.method.tags) {
                $(this.hashTagId).tagsinput('add', this.method.tags[t]);
            }
            $(this.hashTagId).on('itemAdded', function(event) {
                // event.item: contains the item. Convert jQuery event to native event for vue.js
                var e = document.createEvent('HTMLEvents');
                e.initEvent('change', true, true);
                setTimeout(function(){
                    this.dispatchEvent(e);
                },0);
            });
            $(this.hashTagId).on('itemRemoved', function(event) {
                // event.item: contains the item. Convert jQuery event to native event for vue.js
                var e = document.createEvent('HTMLEvents');
                e.initEvent('change', true, true);
                setTimeout(function(){
                    this.dispatchEvent(e);
                },0);
            });
        }
    },
    computed: {
        httpMethod : {
            get : function() {
                return this.index.toUpperCase();
            },
            set : function(newVal) {
                this.$parent.renameOperation(this.index, newVal.toLowerCase());
            }
        },
        hashUid : function() {
            return '#'+this._uid;
        },
		descId : function() {
			return 'txtOpDesc'+this._uid;
		},
        tagId : function() {
            return 'tags-input'+this._uid;
        },
        hashTagId : function() {
            return '#'+this.tagId;
        },
        vtags : {
            get : function() {
				if (!this.method.tags) Vue.set(this.method, 'tags', []);
                return this.method.tags;
            },
            set : function(newVal) {
                this.method.tags = newVal;
            }
        }
    },
    beforeMount : function() {
        if (!this.method.externalDocs) {
            Vue.set(this.method, 'externalDocs', {});
        }
    },
	template: '#template-method'
});

Vue.component('api-response', {
    props: ["response", "status", "method"],
    computed: {
        statusCode: {
            get: function () {
                return this.status;
            },
            set: function (newVal) {
                this.$parent.renameResponse(this.status, newVal);
            }
        }
    },
    methods: {
        addResponse: function () {
            this.$parent.addResponse();
        },
        removeResponse: function () {
            this.$root.save();
            Vue.delete(this.method.responses, this.status);
            if (Object.keys(this.method.responses).length==0) {
                Vue.set(this.method.responses,'default',{description:'Default response'});
            }
        },
        addMediaType: function() {
            if (!this.response.content['change/me']) {
                Vue.set(this.response.content,'change/me',{schema:{}});
            }
        },
        renameMediaType: function(oldName, newName) {
            Vue.set(this.response.content, newName, this.response.content[oldName]);
            Vue.delete(this.response.content, oldName);
        }
    },
    data: function () {
        return {}
    }
});

Vue.component('api-mediatype', {
    props: ["content", "mediatype", "response"],
    computed: {
        mediaTypeName: {
            get: function () {
                return this.mediatype;
            },
            set: function (newVal) {
                this.$parent.renameMediaType(this.mediatype, newVal);
            }
        }
    },
    methods: {
        addMediaType: function () {
            this.$parent.addMediaType();
        },
        duplicateMediaType: function() {
            if (!this.response.content['change/me']) {
                var newContent = clone(this.content);
                Vue.set(this.response.content,'change/me',newContent);
            }
        },
        editMediaType: function (mediatype) {
            var initial = deref(this.response.content[mediatype].schema,this.$root.container.openapi);
            var editorOptions = {};
            var element = document.getElementById('schemaContainer');
            try {
                this.schemaEditor = new JSONEditor(element, editorOptions);
				this.schemaEditor.set(initial);
				this.schemaEditor.expandAll();
                schemaEditorClose = function() {
                    this.schemaEditor.destroy();
                    $('#schemaModal').removeClass('is-active');
                }.bind(this);
                schemaEditorSave = function() {
                    // TODO saving back to shared schema
                    this.response.content[mediatype].schema = this.schemaEditor.get();
                    schemaEditorClose();
                }.bind(this);
                $('#schemaModal').addClass('is-active');
            }
            catch (ex) {
                this.$parent.$parent.showAlert('The editor could not be instantiated (circular schemas are not yet supported): '+ex.message);
            }
        },
        removeMediaType: function () {
            this.$root.save();
            Vue.delete(this.response.content, this.mediatype);
            if (Object.keys(this.response.content).length==0) {
                Vue.set(this.response.content,'application/json',{schema:{}});
            }
        }
    },
    data: function () {
        return {}
    }
});
