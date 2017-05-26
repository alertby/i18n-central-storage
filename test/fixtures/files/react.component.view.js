/* global gettext */
import React, { Component } from 'react';
import {debounce} from 'lodash';
import {
  View,
  TextInput
} from 'react-native';
import SearchAutocompleteComponent from './SearchAutocompleteComponent';

import styles from './styles';

const DEBOUNCE_TIMEOUT = 400;


export default class SearchInputComponent extends Component {
  constructor(props) {
    super(props);

    this.delaySearchSubmision = debounce(this.onChangeTextDelayed, DEBOUNCE_TIMEOUT);
    this.label = gettext('test label');

    this.state = {
      query: '',
      isAutocompleteVisible: false
    };
  }

  getInputAutocompleteTemplate() {

    if (!this.state.isAutocompleteVisible) {
      return null;
    }

    return (
      <SearchAutocompleteComponent
        suggestions={this.props.suggestions}
        onAotocompleteItemSelected={this.onAotocompleteItemSelected.bind(this)}
      />
    );
  }

  render() {

    return (
      <View style={styles.container}>
        <TextInput
          value={this.state.query}
          onChangeText={(text) => this.onChangeText(text)}
          onSubmitEditing={this.onSubmitEditing.bind(this)}
          returnKeyType="done"
          placeholder={gettext('Type here to find sevice')}
          style={styles.textInput}
          accessibilityLabel="test-id-textfield"
        />
        {this.getInputAutocompleteTemplate()}
      </View>
    );
  }

  onChangeTextDelayed(value) {

    this.props.onChange(value);
  }

  onChangeText(value) {

    this.setState({
      query: value,
      isAutocompleteVisible: true
    });
    this.delaySearchSubmision(value);
  }

  onAotocompleteItemSelected(value) {
    this.setState({
      query: value,
      isAutocompleteVisible: false
    });
    this.props.onSubmit(value.trim());
  }

  onSubmitEditing() {
    this.setState({
      isAutocompleteVisible: false
    });
    this.props.onSubmit(this.state.query.trim());
  }
}
