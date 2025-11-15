import React from 'react';
import { View } from 'react-native';
import styles from '../styles/globalStyles';

/**
 * Slot-based Header Component
 * 
 * Usage:
 * <Header
 *    left={<YourComponent />}
 *    center={<YourCenterComponent />}
 *    right={<YourRightComponent />}
 * />
 */

const Header = ({ left, center, right }) => {
  return (
    <View style={styles.header}>
      {/* LEFT SLOT */}
      <View style={{ flex: 1 }}>
        {left ? left : null}
      </View>

      {/* CENTER SLOT */}
      <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
        {center ? center : null}
      </View>

      {/* RIGHT SLOT */}
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {right ? right : null}
      </View>
    </View>
  );
};

export default Header;