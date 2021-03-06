import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Linking,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  BackHandler,
} from 'react-native';
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from 'react-native-popup-menu';
import colors from '../constants/colors';
import LocationServices from '../services/LocationService';
import BroadcastingServices from '../services/BroadcastingService';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import exportImage from './../assets/images/export.png';
import news from './../assets/images/newspaper.png';
import kebabIcon from './../assets/images/kebabIcon.png';
import pkLogo from './../assets/images/PKLogo.png';

import { IntersectSet } from '../helpers/Intersect';
import { GetStoreData, SetStoreData } from '../helpers/General';
import languages from './../locales/languages';

const width = Dimensions.get('window').width;

class LocationTracking extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timer_intersect: null,
      isLogging: '',
    };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    GetStoreData('PARTICIPATE')
      .then(isParticipating => {
        if (isParticipating === 'true') {
          this.setState({
            isLogging: true,
          });
          this.willParticipate();
        } else {
          this.setState({
            isLogging: false,
          });
        }
      })
      .catch(error => console.log(error));

    let timer_intersect = setInterval(this.intersect_tick, 1000 * 60 * 60 * 12); // once every 12 hours
    // DEBUG:  1000 * 10); // once every 10 seconds

    this.setState({
      timer_intersect,
    });
  }

  intersect_tick = () => {
    // This function is called once every 12 hours.  It should do several things:

    // Get the user's health authorities
    GetStoreData('HEALTH_AUTHORITIES')
      .then(authority_list => {
        if (!authority_list) {
          // DEBUG: Force a test list
          // authority_list = [
          //  {
          //    name: 'Platte County Health',
          //    url:
          //      'https://raw.githack.com/tripleblindmarket/safe-places/develop/examples/safe-paths.json',
          //  },
          //];
          return;
        }

        if (authority_list) {
          // Pull down data from all the registered health authorities
          for (let authority of authority_list) {
            fetch(authority.url)
              .then(response => response.json())
              .then(responseJson => {
                // Example response =
                // { "authority_name":  "Steve's Fake Testing Organization",
                //   "publish_date_utc": "1584924583",
                //   "info_website": "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
                //   "concern_points":
                //    [
                //      { "time": 123, "latitude": 12.34, "longitude": 12.34},
                //      { "time": 456, "latitude": 12.34, "longitude": 12.34}
                //    ]
                // }

                // Update cache of info about the authority
                // (info_url might have changed, etc.)

                // TODO: authority_list, match by authority_list.url, then re-save "authority_name", "info_website" and
                // "publish_date_utc" (we should notify users if their authority is no longer functioning.)
                // console.log('Received data from authority.url=', authority.url);

                IntersectSet(responseJson.concern_points);
              });
          }
        } else {
          console.log('No authority list');
          return;
        }
      })
      .catch(error => console.log('Failed to load authority list', error));
  };

  componentWillUnmount() {
    clearInterval(this.state.timer_intersect);
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  handleBackPress = () => {
    BackHandler.exitApp(); // works best when the goBack is async
    return true;
  };
  export() {
    this.props.navigation.navigate('ExportScreen', {});
  }

  import() {
    this.props.navigation.navigate('ImportScreen', {});
  }

  overlap() {
    this.props.navigation.navigate('OverlapScreen', {});
  }

  willParticipate = () => {
    SetStoreData('PARTICIPATE', 'true').then(() => {
      LocationServices.start();
      BroadcastingServices.start();
    });

    // Check and see if they actually authorized in the system dialog.
    // If not, stop services and set the state to !isLogging
    // Fixes tripleblindmarket/private-kit#129
    BackgroundGeolocation.checkStatus(({ authorization }) => {
      if (authorization === BackgroundGeolocation.AUTHORIZED) {
        this.setState({
          isLogging: true,
        });
      } else if (authorization === BackgroundGeolocation.NOT_AUTHORIZED) {
        LocationServices.stop(this.props.navigation);
        BroadcastingServices.stop(this.props.navigation);
        this.setState({
          isLogging: false,
        });
      }
    });
  };

  news() {
    this.props.navigation.navigate('NewsScreen', {});
  }

  licenses() {
    this.props.navigation.navigate('LicensesScreen', {});
  }

  settings() {
    this.props.navigation.navigate('SettingsScreen', {});
  }

  willParticipate = () => {
    SetStoreData('PARTICIPATE', 'true').then(() => LocationServices.start());
    this.setState({
      isLogging: true,
    });
  };

  notifications() {
    this.props.navigation.navigate('NotificationScreen', {});
  }

  settings() {
    this.props.navigation.navigate('SettingsScreen', {});
  }

  willParticipate = () => {
    SetStoreData('PARTICIPATE', 'true').then(() => {
      LocationServices.start();
      BroadcastingServices.start();
    });
    this.setState({
      isLogging: true,
    });
  };

  setOptOut = () => {
    LocationServices.stop(this.props.navigation);
    BroadcastingServices.stop(this.props.navigation);
    this.setState({
      isLogging: false,
    });
  };

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.main}>
          {/* A modal menu. Currently only used for license info */}
          <Menu
            style={{
              position: 'absolute',
              alignSelf: 'flex-end',
              zIndex: 10,
            }}>
            <MenuTrigger style={{ marginTop: 14 }}>
              <Image
                source={kebabIcon}
                style={{
                  width: 15,
                  height: 28,
                  padding: 14,
                }}
              />
            </MenuTrigger>
            <MenuOptions>
              <MenuOption
                onSelect={() => {
                  this.settings();
                }}>
                <Text style={styles.menuOptionText}>Settings</Text>
              </MenuOption>
              <MenuOption
                onSelect={() => {
                  this.licenses();
                }}>
                <Text style={styles.menuOptionText}>Licenses</Text>
              </MenuOption>
              <MenuOption
                onSelect={() => {
                  this.notifications();
                }}>
                <Text style={styles.menuOptionText}>Notifications</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
          <Text style={styles.headerTitle}>
            {languages.t('label.private_kit')}
          </Text>

          <View style={styles.buttonsAndLogoView}>
            {this.state.isLogging ? (
              <>
                <Image
                  source={pkLogo}
                  style={{
                    width: 132,
                    height: 164.4,
                    alignSelf: 'center',
                    marginTop: 12,
                  }}
                />
                <TouchableOpacity
                  onPress={() => this.setOptOut()}
                  style={styles.stopLoggingButtonTouchable}>
                  <Text style={styles.stopLoggingButtonText}>
                    {languages.t('label.stop_logging')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => this.overlap()}
                  style={styles.startLoggingButtonTouchable}>
                  <Text style={styles.startLoggingButtonText}>
                    {languages.t('label.overlap')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Image
                  source={pkLogo}
                  style={{
                    width: 132,
                    height: 164.4,
                    alignSelf: 'center',
                    marginTop: 12,
                    opacity: 0.3,
                  }}
                />
                <TouchableOpacity
                  onPress={() => this.willParticipate()}
                  style={styles.startLoggingButtonTouchable}>
                  <Text style={styles.startLoggingButtonText}>
                    {languages.t('label.start_logging')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {this.state.isLogging ? (
              <Text style={styles.sectionDescription}>
                {languages.t('label.logging_message')}
              </Text>
            ) : (
              <Text style={styles.sectionDescription}>
                {languages.t('label.not_logging_message')}
              </Text>
            )}
          </View>

          <View style={styles.actionButtonsView}>
            <TouchableOpacity
              onPress={() => this.import()}
              style={styles.actionButtonsTouchable}>
              <Image
                style={styles.actionButtonImage}
                source={exportImage}
                resizeMode={'contain'}
              />
              <Text style={styles.actionButtonText}>
                {languages.t('label.import')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => this.export()}
              style={styles.actionButtonsTouchable}>
              <Image
                style={[
                  styles.actionButtonImage,
                  { transform: [{ rotate: '180deg' }] },
                ]}
                source={exportImage}
                resizeMode={'contain'}
              />
              <Text style={styles.actionButtonText}>
                {languages.t('label.export')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => this.news()}
              style={styles.actionButtonsTouchable}>
              <Image
                style={styles.actionButtonImage}
                source={news}
                resizeMode={'contain'}
              />
              <Text style={styles.actionButtonText}>
                {languages.t('label.news')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text
              style={[
                styles.sectionDescription,
                { textAlign: 'center', paddingTop: 15 },
              ]}>
              {languages.t('label.url_info')}{' '}
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: 'blue', textAlign: 'center', marginTop: 0 },
              ]}
              onPress={() => Linking.openURL('https://privatekit.mit.edu')}>
              {languages.t('label.private_kit_url')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  // Container covers the entire screen
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: colors.PRIMARY_TEXT,
    backgroundColor: colors.WHITE,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 38,
    padding: 0,
    fontFamily: 'OpenSans-Bold',
  },
  subHeaderTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    padding: 5,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
  },
  buttonsAndLogoView: {
    flex: 6,
    justifyContent: 'space-around',
  },
  actionButtonsView: {
    width: width * 0.7866,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 2,
    alignItems: 'center',
    marginBottom: -10,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingBottom: 10,
    justifyContent: 'flex-end',
  },
  sectionDescription: {
    fontSize: 12,
    lineHeight: 24,
    fontFamily: 'OpenSans-Regular',
    marginLeft: 10,
    marginRight: 10,
  },
  startLoggingButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#665eff',
    height: 52,
    alignSelf: 'center',
    width: width * 0.7866,
    justifyContent: 'center',
  },
  startLoggingButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
  },
  stopLoggingButtonTouchable: {
    borderRadius: 12,
    backgroundColor: '#fd4a4a',
    height: 52,
    alignSelf: 'center',
    width: width * 0.7866,
    justifyContent: 'center',
  },
  stopLoggingButtonText: {
    fontFamily: 'OpenSans-Bold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
  },
  actionButtonsTouchable: {
    height: 76,
    borderRadius: 8,
    backgroundColor: '#454f63',
    width: width * 0.23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonImage: {
    height: 21.6,
    width: 32.2,
  },
  actionButtonText: {
    opacity: 0.56,
    fontFamily: 'OpenSans-Bold',
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
    textAlign: 'center',
    color: '#ffffff',
    marginTop: 6,
  },
  menuOptionText: {
    fontFamily: 'OpenSans-Regular',
    fontSize: 14,
    padding: 10,
  },
});

export default LocationTracking;
