using System.Collections;
using System.Collections.Generic;
using Cinemachine;
using UnityEngine;
using UnityEngine.UI;

public class SwitchCharacter : MonoBehaviour
{
    [SerializeField]
    Metadata _metadata;
    [SerializeField]
    GameObject _dusk, _dawn;
    [SerializeField]
    GameObject _duskLighting, _dawnLighting;
    [SerializeField]
    HUD _duskInventory, _dawnInventory;
    [SerializeField]
    float _transitionTime = 1;
    [SerializeField]
    Image fadeImage;

    private GameObject _duskInventoryGameObject, _dawnInventoryGameObject;

    private bool isTransitioning = false;


    CinemachineVirtualCamera _currentduskCamera, _currentdawnCamera;
    GameObject _currentCharacter;

    private HUD dawnInventoryHud, duskInventoryHud;

    // Start is called before the first frame update
    void Start()
    {
        _currentCharacter = _dawn;
        _currentduskCamera = _metadata.getDuskCurrentCamera();
        _currentdawnCamera = _metadata.getDawnCurrentCamera();
        _dawnLighting.SetActive(true);
        _duskLighting.SetActive(false);

        _duskInventoryGameObject = _duskInventory.gameObject;
        _dawnInventoryGameObject = _dawnInventory.gameObject;

        fadeImage.canvasRenderer.SetAlpha(0.0f);
        
    }



    // Update is called once per frame
    void Update()
    {
        _currentduskCamera = _metadata.getDuskCurrentCamera();
        _currentdawnCamera = _metadata.getDawnCurrentCamera();

        // Don't allow switching when in dialog or while transitioning
        if (Input.GetKeyDown("r") && !_metadata.dawnInDialog && !_metadata.duskInDialog && !isTransitioning)
        {
            isTransitioning = true;
            // Switch to Dawn
            if (_currentCharacter == _dusk)
            {
                disableDusk();
                fadeIn();
                StartCoroutine(enableDawnAfterTime(_transitionTime));
                
            }
            // Switch to Dusk
            else
            {
                disableDawn();
                fadeIn();
                StartCoroutine(enableDuskAfterTime(_transitionTime));
            }
        }
    }

    IEnumerator enableDawnAfterTime(float time)
    {
        yield return new WaitForSeconds(time);
        _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;
        IEnumerator activateDawn(float time)
        {
            yield return new WaitForSeconds(time);
            enableDawn();
            isTransitioning = false;
        }
        fadeOut();
        StartCoroutine(activateDawn(_transitionTime));
    }

    

    IEnumerator enableDuskAfterTime(float time)
    {

        yield return new WaitForSeconds(time);
        _currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;
        IEnumerator activateDusk(float time)
        {
            yield return new WaitForSeconds(time);
            enableDusk();
            isTransitioning = false;
        }
        fadeOut();
        StartCoroutine(activateDusk(_transitionTime));
    }

    private void fadeIn()
    {
        fadeImage.CrossFadeAlpha(1, _transitionTime, false);
    }

    private void fadeOut()
    {
        fadeImage.CrossFadeAlpha(0, _transitionTime, false);
    }

    private void disableDusk()
    {

        _dusk.GetComponent<ThreeDMovement>().enabled = false;
        _dusk.GetComponent<NPCInteract>().enabled = false;
        _currentduskCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

        //Disable inventory toggling
        _duskInventory.toggleHud(false);
        _duskInventoryGameObject.SetActive(false);
    }

    private void disableDawn()
    {
        _dawn.GetComponent<ThreeDMovement>().enabled = false;
        _dawn.GetComponent<NPCInteract>().enabled = false;
        
        _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

        //Disable inventory toggling
        _dawnInventory.toggleHud(false);
        _dawnInventoryGameObject.SetActive(false);
    }

    private void enableDusk()
    {
        _dusk.GetComponent<ThreeDMovement>().enabled = true;
        _dusk.GetComponent<NPCInteract>().enabled = true;
        

        _currentCharacter = _dusk;
        _metadata.setCurPlayer(_dusk);

        // Change lighting presets
        _dawnLighting.SetActive(false);
        _duskLighting.SetActive(true);

        //Re-anble Inventory toggling
        _duskInventoryGameObject.SetActive(true);
    }

    private void enableDawn()
    {
        _dawn.GetComponent<ThreeDMovement>().enabled = true;
        _dawn.GetComponent<NPCInteract>().enabled = true;
       

        _metadata.setCurPlayer(_dawn);
        _currentCharacter = _dawn;

        // Change lighting presets
        _dawnLighting.SetActive(true);
        _duskLighting.SetActive(false);

        //Re-anble Inventory toggling
        _dawnInventoryGameObject.SetActive(true);
    }
}