let traps = [];

const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');
const FocusTrap = require('focus-trap-react');
const _get = require('lodash/get');

/**
 * MXFocusTrap
 *
 * Why is this needed?
 *
 * FocusTrap does not un-pause the previous trap when the current trap is unmounted.
 * This ensures that the previously trapped component is un-paused.
 */
class MXFocusTrap extends React.Component {
  static propTypes = {
    focusTrapOptions: PropTypes.object
  }

  state = {
    paused: false
  }

  componentWillMount () {
    // FocusTrap does it's own pausing but these React components also need to be paused
    traps.forEach(component => {
      component.setState({ paused: true });
      const nodeForComponent = ReactDOM.findDOMNode(component);

      if (nodeForComponent && nodeForComponent.setAttribute) {
        nodeForComponent.setAttribute('aria-hidden', true);
      }
    });
    traps.push(this);

    this._siblingNodeToRenderNextTo = this._getSiblingNodeToRenderNextTo(_get(this.props, 'focusTrapOptions.portalTo', null));
    if (this._siblingNodeToRenderNextTo && this._siblingNodeToRenderNextTo.setAttribute) {
      this._siblingNodeToRenderNextTo.setAttribute('aria-hidden', true);
    }
  }

  componentWillUnmount () {
    traps = traps.filter(component => component !== this);
    const lastTrap = traps[traps.length - 1];

    if (lastTrap) {
      lastTrap.setState({ paused: false });
      const nodeForLastTrap = ReactDOM.findDOMNode(lastTrap);

      if (nodeForLastTrap && nodeForLastTrap.setAttribute) {
        nodeForLastTrap.setAttribute('aria-hidden', false);
      }

      return;
    }

    if (this._siblingNodeToRenderNextTo && this._siblingNodeToRenderNextTo.setAttribute) {
      this._siblingNodeToRenderNextTo.setAttribute('aria-hidden', false);
    }
  }

  _getSiblingNodeToRenderNextTo = queryString => {
    if (!queryString || typeof queryString !== 'string') {
      return null;
    }

    return document.querySelector(queryString);
  }

  render () {
    // Portal next to selected sibling
    if (this._siblingNodeToRenderNextTo && this._siblingNodeToRenderNextTo.parentNode) {
      return ReactDOM.createPortal(
        (
          <FocusTrap {...this.props} paused={this.state.paused}>
            {this.props.children}
          </FocusTrap>
        ),
        this._siblingNodeToRenderNextTo.parentNode
      );
    }

    // Render in normal location
    return (
      <FocusTrap {...this.props} paused={this.state.paused}>
        {this.props.children}
      </FocusTrap>
    );
  }
}

module.exports = MXFocusTrap;