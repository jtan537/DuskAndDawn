using System.Collections;
using System.Collections.Generic;
using Cinemachine;
using UnityEngine;

public class SwitchCharacter : MonoBehaviour
{
    [SerializeField]
    Metadata _metadata;
    [SerializeField]
    GameObject _dusk, _dawn;
    [SerializeField]
    GameObject _duskLighting, _dawnLighting;
    [SerializeField]
    GameObject _duskInventory, _dawnInventory;

    CinemachineVirtualCamera _currentduskCamera, _currentdawnCamera;
    GameObject _currentCharacter;

    // Start is called before the first frame update
    void Start()
    {
        _currentCharacter = _dawn;
        _currentduskCamera = _metadata.getDuskCurrentCamera();
        _currentdawnCamera = _metadata.getDawnCurrentCamera();
        _dawnLighting.SetActive(true);
        _duskLighting.SetActive(false);
        _dawnInventory.SetActive(true);
        _duskInventory.SetActive(false);
    }

    // Update is called once per frame
    void Update()
    {
        _currentduskCamera = _metadata.getDuskCurrentCamera();
        _currentdawnCamera = _metadata.getDawnCurrentCamera();

        // Don't allow switching when in dialog
        if (Input.GetKeyDown("r") && !_metadata.dawnInDialog && !_metadata.duskInDialog)
        {
            // Switch to Dawn
            if (_currentCharacter == _dusk)
            {
                _dusk.GetComponent<ThreeDMovement>().enabled = false;
                _dusk.GetComponent<NPCInteract>().enabled = false;
                _currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

                _dawn.GetComponent<ThreeDMovement>().enabled = true;
                _dawn.GetComponent<NPCInteract>().enabled = true;
                _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;

                _metadata.setCurPlayer(_dawn);
                _currentCharacter = _dawn;

                // Change lighting presets
                _dawnLighting.SetActive(true);
                _duskLighting.SetActive(false);
                // Change inventory hud
                _dawnInventory.SetActive(true);
                _duskInventory.SetActive(false);
            }
            // Switch to Dusk
            else
            {
                _dusk.GetComponent<ThreeDMovement>().enabled = true;
                _dusk.GetComponent<NPCInteract>().enabled = true;
                _currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;

                _dawn.GetComponent<ThreeDMovement>().enabled = false;
                _dawn.GetComponent<NPCInteract>().enabled = false;
                _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

                _currentCharacter = _dusk;
                _metadata.setCurPlayer(_dusk);

                // Change lighting presets
                _dawnLighting.SetActive(false);
                _duskLighting.SetActive(true);

                // Change inventory hud
                _dawnInventory.SetActive(false);
                _duskInventory.SetActive(true);
            }
        }
    }
}