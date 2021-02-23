using System.Collections;
using System.Collections.Generic;
using Cinemachine;
using UnityEngine;

public class SwitchCharacter : MonoBehaviour
{
    [SerializeField]
    CameraController _cameras;
    [SerializeField]
    GameObject _dusk, _dawn;
    [SerializeField]
    Light _duskLighting, _dawnLighting;

    CinemachineVirtualCamera _currentduskCamera, _currentdawnCamera;
    GameObject _currentCharacter;

    // Start is called before the first frame update
    void Start()
    {
        _currentCharacter = _dawn;
        _currentduskCamera = _cameras.getDuskCurrentCamera();
        _currentdawnCamera = _cameras.getDawnCurrentCamera();
        _dawnLighting.enabled = true;
        _duskLighting.enabled = false;
    }

    // Update is called once per frame
    void Update()
    {
        _currentduskCamera = _cameras.getDuskCurrentCamera();
        _currentdawnCamera = _cameras.getDawnCurrentCamera();
        if (Input.GetKeyDown("r"))
        {
            // Switch to Dawn
            if (_currentCharacter == _dusk)
            {
                _dusk.GetComponent<ThreeDMovement>().enabled = false;
                _currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

                _dawn.GetComponent<ThreeDMovement>().enabled = true;
                _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;

                _cameras.setCurPlayer(_dawn);
                _currentCharacter = _dawn;

                // Change lighting presets
                _dawnLighting.enabled = true;
                _duskLighting.enabled = false;
            }
            // Switch to Dusk
            else
            {
                _dusk.GetComponent<ThreeDMovement>().enabled = true;
                _currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;

                _dawn.GetComponent<ThreeDMovement>().enabled = false;
                _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

                _currentCharacter = _dusk;
                _cameras.setCurPlayer(_dusk);

                // Change lighting presets
                _dawnLighting.enabled = false;
                _duskLighting.enabled = true;
            }
        }
    }
}