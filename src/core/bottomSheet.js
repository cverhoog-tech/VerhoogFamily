'use strict';
// ============================================================
// BOTTOM SHEET v0.352
// Reusable wrapper around ModalManager for mobile-native sheets.
// ============================================================

(function(){
  var VERSION = '0.352';

  function field(label, inputHtml){
    return '<div class="fam-modal-field"><label>'+label+'</label>'+inputHtml+'</div>';
  }

  function input(name, placeholder, value){
    return '<input name="'+(name||'')+'" placeholder="'+(placeholder||'')+'" value="'+(value||'')+'" />';
  }

  function textarea(name, placeholder, value){
    return '<textarea rows="4" name="'+(name||'')+'" placeholder="'+(placeholder||'')+'">'+(value||'')+'</textarea>';
  }

  function open(options){
    options = options || {};
    if(!window.ModalManager) return null;

    return window.ModalManager.open({
      title: options.title || '',
      html: options.html || '',
      text: options.text || '',
      content: options.content,
      closeOnBackdrop: options.closeOnBackdrop,
      onOpen: options.onOpen,
      actions: options.actions || []
    });
  }

  function form(options){
    options = options || {};
    var fields = Array.isArray(options.fields) ? options.fields : [];

    var html = fields.map(function(f){
      if(f.type === 'textarea') return field(f.label || '', textarea(f.name, f.placeholder, f.value));
      if(f.type === 'custom') return '<div class="fam-modal-field">'+(f.html || '')+'</div>';
      return field(f.label || '', input(f.name, f.placeholder, f.value));
    }).join('');

    return open({
      title: options.title,
      html: html,
      onOpen: function(ctx){
        var modal = ctx.modal;
        var formValues = function(){
          var values = {};
          modal.querySelectorAll('input,textarea,select').forEach(function(el){
            values[el.name || el.id || ('field_'+Math.random())] = el.value;
          });
          return values;
        };

        if(typeof options.onOpen === 'function') options.onOpen({ modal: modal, values: formValues, close: ctx.close });

        modal.querySelectorAll('input').forEach(function(input, index){
          if(index === 0) setTimeout(function(){ try { input.focus(); } catch(e){} }, 120);
        });
      },
      actions: [
        { label: options.cancelLabel || 'Annuleren' },
        {
          label: options.submitLabel || 'Opslaan',
          primary: true,
          onClick: function(ctx){
            var values = {};
            ctx.modal.querySelectorAll('input,textarea,select').forEach(function(el){
              values[el.name || el.id || ('field_'+Math.random())] = el.value;
            });
            if(typeof options.onSubmit === 'function') return options.onSubmit(values, ctx);
          }
        }
      ]
    });
  }

  window.BottomSheet = {
    version: VERSION,
    open: open,
    form: form,
    field: field,
    input: input,
    textarea: textarea
  };
})();
