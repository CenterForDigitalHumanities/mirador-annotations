import React from 'react';
import { shallow } from 'enzyme';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import miradorAnnotationPlugin from '../src/plugins/miradorAnnotationPlugin';

/** */
function createWrapper(props) {
  return shallow(
    <miradorAnnotationPlugin.component
      config={{}}
      TargetComponent="<div>hello</div>"
      targetProps={{}}
      addCompanionWindow={jest.fn()}
      receiveAnnotation={jest.fn()}
      switchToSingleCanvasView={jest.fn()}
      windowViewType="single"
      {...props}
    />,
  );
}

describe('MiradorAnnotation', () => {
  let wrapper;
  it('renders a create new button', () => {
    wrapper = createWrapper();
    expect(wrapper.find(MiradorMenuButton).props()['aria-label']).toBe('Create new annotation');
  });
  it('opens a new companionWindow when clicked', () => {
    const mockAddCompanionWindow = jest.fn();
    const receiveAnnotationMock = jest.fn();
    wrapper = createWrapper({
      addCompanionWindow: mockAddCompanionWindow,
      receiveAnnotation: receiveAnnotationMock,
    });
    wrapper.find(MiradorMenuButton).simulate('click');
    expect(mockAddCompanionWindow).toHaveBeenCalledWith(
      'annotationCreation',
      {
        position: 'right',
      },
    );
  });
  it('opens single canvas view dialog if not in single view', () => {
    wrapper = createWrapper({
      windowViewType: 'book',
    });
    expect(wrapper.instance().state.singleCanvasDialogOpen).toBe(false);
    wrapper.find(MiradorMenuButton).simulate('click');
    expect(wrapper.instance().state.singleCanvasDialogOpen).toBe(true);
  });
});
