import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Int "mo:core/Int";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  module Location {
    public func compare(loc1 : Location, loc2 : Location) : Order.Order {
      Int.compare(loc1.timestamp, loc2.timestamp);
    };
  };

  public type UserProfile = {
    username : Text;
    email : Text;
    emergencyContact : Text;
  };

  public type Location = {
    timestamp : Int;
    latitude : Float;
    longitude : Float;
    locationName : Text;
  };

  public type Alert = {
    timestamp : Int;
    latitude : Float;
    longitude : Float;
    description : Text;
    resolved : Bool;
  };

  public type UserSettings = {
    safeZoneRadius : Nat;
    alertStartHour : Nat;
    alarmSoundEnabled : Bool;
    safeZoneCenterLat : Float;
    safeZoneCenterLng : Float;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let locationHistory = Map.empty<Principal, List.List<Location>>();
  let userAlerts = Map.empty<Principal, List.List<Alert>>();
  let userSettings = Map.empty<Principal, UserSettings>();
  let deviceStatus = Map.empty<Principal, Int>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func addLocation(location : Location) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add locations");
    };

    let history = switch (locationHistory.get(caller)) {
      case (null) { List.empty<Location>() };
      case (?h) { h };
    };

    let newHistory = List.fromIter<Location>(
      [location].values().concat(history.values()).take(50)
    );

    locationHistory.add(caller, newHistory);
  };

  public query ({ caller }) func getLocationHistory() : async [Location] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access location history");
    };

    switch (locationHistory.get(caller)) {
      case (null) { [] };
      case (?history) {
        history.toArray().sort();
      };
    };
  };

  public shared ({ caller }) func addAlert(alert : Alert) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add alerts");
    };

    let alerts = switch (userAlerts.get(caller)) {
      case (null) { List.empty<Alert>() };
      case (?a) { a };
    };

    alerts.add(alert);
    userAlerts.add(caller, alerts);
  };

  public shared ({ caller }) func resolveAlert(alertIndex : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can resolve alerts");
    };

    let alerts = switch (userAlerts.get(caller)) {
      case (null) { Runtime.trap("No alerts found") };
      case (?a) { a };
    };

    if (alertIndex >= alerts.size()) {
      Runtime.trap("Alert index out of bounds");
    };

    let alertsArray = alerts.toArray();
    if (alertIndex >= alertsArray.size()) {
      Runtime.trap("Alert index out of bounds");
    };

    let alert = alertsArray[alertIndex];
    let newAlert = {
      alert with
      resolved = true;
    };
    alerts.put(alertIndex, newAlert);
  };

  public query ({ caller }) func getAlerts() : async [Alert] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access alerts");
    };

    switch (userAlerts.get(caller)) {
      case (null) { [] };
      case (?alerts) {
        alerts.toArray();
      };
    };
  };

  public shared ({ caller }) func saveSettings(settings : UserSettings) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save settings");
    };

    userSettings.add(caller, settings);
  };

  public query ({ caller }) func getSettings() : async UserSettings {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can access settings");
    };

    switch (userSettings.get(caller)) {
      case (null) { Runtime.trap("Settings not found") };
      case (?settings) { settings };
    };
  };

  public shared ({ caller }) func updateDeviceStatus() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update status");
    };

    deviceStatus.add(caller, Time.now());
  };

  public query ({ caller }) func isDeviceOnline() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check device status");
    };

    switch (deviceStatus.get(caller)) {
      case (null) { false };
      case (?lastSeen) {
        let onlineThreshold = 300_000_000_000; // 5 minutes in nanoseconds
        Time.now() - lastSeen < onlineThreshold;
      };
    };
  };
};
