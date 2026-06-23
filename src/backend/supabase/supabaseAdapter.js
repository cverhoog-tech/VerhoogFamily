'use strict';
// ============================================================
// SUPABASE ADAPTER v0.310
// Backend boundary for future FamilyApp production sync.
// This file intentionally does not require credentials yet.
// It defines the contract used by LiveSyncAdapter/HouseholdRepository.
// ============================================================

(function(){
  var VERSION = '0.310';
  var config = {
    enabled: false,
    url: '',
    anonKey: '',
    schema: 'public'
  };
  var client = null;
  var subscriptions = [];

  function nowIso(){ return new Date().toISOString(); }

  function configure(nextConfig){
    config = Object.assign({}, config, nextConfig || {});
    return status();
  }

  function isConfigured(){
    return !!(config.enabled && config.url && config.anonKey && window.supabase);
  }

  function getClient(){
    if(client) return client;
    if(!isConfigured()) return null;
    client = window.supabase.createClient(config.url, config.anonKey, { db: { schema: config.schema || 'public' } });
    return client;
  }

  function status(){
    return {
      version: VERSION,
      provider: 'supabase',
      enabled: !!config.enabled,
      configured: isConfigured(),
      connected: !!client,
      realtime: subscriptions.length > 0,
      at: nowIso()
    };
  }

  function requireClient(){
    var supabase = getClient();
    if(!supabase) throw new Error('Supabase is not configured yet.');
    return supabase;
  }

  var auth = {
    async signUp(email, password, profile){
      var supabase = requireClient();
      var result = await supabase.auth.signUp({
        email: email,
        password: password,
        options: { data: profile || {} }
      });
      return result;
    },
    async signIn(email, password){
      var supabase = requireClient();
      return await supabase.auth.signInWithPassword({ email: email, password: password });
    },
    async signOut(){
      var supabase = requireClient();
      return await supabase.auth.signOut();
    },
    async getSession(){
      var supabase = requireClient();
      return await supabase.auth.getSession();
    },
    onAuthStateChange(callback){
      var supabase = requireClient();
      return supabase.auth.onAuthStateChange(callback);
    }
  };

  var db = {
    async read(table, filters){
      var supabase = requireClient();
      var query = supabase.from(table).select('*');
      Object.keys(filters || {}).forEach(function(key){ query.eq(key, filters[key]); });
      return await query;
    },
    async insert(table, payload){
      var supabase = requireClient();
      return await supabase.from(table).insert(payload).select();
    },
    async upsert(table, payload, options){
      var supabase = requireClient();
      return await supabase.from(table).upsert(payload, options || {}).select();
    },
    async update(table, id, patch){
      var supabase = requireClient();
      return await supabase.from(table).update(Object.assign({}, patch || {}, { updated_at: nowIso() })).eq('id', id).select();
    },
    async remove(table, id){
      var supabase = requireClient();
      return await supabase.from(table).delete().eq('id', id);
    }
  };

  var realtime = {
    subscribeHousehold(householdId, callback){
      var supabase = requireClient();
      var channel = supabase.channel('household:' + householdId)
        .on('postgres_changes', { event: '*', schema: config.schema || 'public', table: 'household_members', filter: 'household_id=eq.' + householdId }, callback)
        .on('postgres_changes', { event: '*', schema: config.schema || 'public', table: 'group_quests', filter: 'household_id=eq.' + householdId }, callback)
        .on('postgres_changes', { event: '*', schema: config.schema || 'public', table: 'activity_events', filter: 'household_id=eq.' + householdId }, callback)
        .subscribe();
      subscriptions.push(channel);
      return channel;
    },
    unsubscribeAll(){
      var supabase = getClient();
      if(!supabase) return;
      subscriptions.forEach(function(channel){ try { supabase.removeChannel(channel); } catch(e) {} });
      subscriptions = [];
    }
  };

  var presence = {
    subscribe(householdId, memberId, callback){
      var supabase = requireClient();
      var channel = supabase.channel('presence:' + householdId, { config: { presence: { key: memberId } } });
      channel.on('presence', { event: 'sync' }, function(){ callback(channel.presenceState()); });
      channel.subscribe(async function(status){
        if(status === 'SUBSCRIBED'){
          await channel.track({ memberId: memberId, online_at: nowIso() });
        }
      });
      subscriptions.push(channel);
      return channel;
    }
  };

  window.SupabaseAdapter = {
    version: VERSION,
    configure: configure,
    status: status,
    getClient: getClient,
    auth: auth,
    db: db,
    realtime: realtime,
    presence: presence
  };
})();
