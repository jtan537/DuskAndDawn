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
    private SkyboxControllerShader skyboxCtrl;

    private NPC[] _allNPCs;
    private List<NPC> _dawnNPCs = new List<NPC>(), _duskNPCs = new List<NPC>();

    public static bool isTransitioning = false;
    public static bool switchedToDawn = false;


    CinemachineVirtualCamera _currentduskCamera, _currentdawnCamera;
    GameObject _currentCharacter;

    private HUD dawnInventoryHud, duskInventoryHud;
    
    // Normally disable switching of chracters unless Dawn and Dusk finish tutorial
    public bool dusk_elixir_drunk = false, dawn_elixir_drunk = false;

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
        _allNPCs = FindObjectsOfType<NPC>();
        foreach (NPC npc in _allNPCs)
        {
            if (npc.gameObject.tag == "Dawn")
            {
                _dawnNPCs.Add(npc);
            } else if (npc.gameObject.tag == "Dusk"){
                _duskNPCs.Add(npc);
            } else
            {
                Debug.LogError("NPC with name:" + npc.gameObject.name + "isn't tagged as either a Dusk or Dawn NPC");
            }

        }

        skyboxCtrl = GameObject.FindObjectOfType<SkyboxControllerShader>();
    }



    // Update is called once per frame
    void Update()
    {
        _currentduskCamera = _metadata.getDuskCurrentCamera();
        _currentdawnCamera = _metadata.getDawnCurrentCamera();

        // Don't allow switching when in dialog or while transitioning
        if (Input.GetKeyDown("r") && !_metadata.dawnInDialog && !_metadata.duskInDialog && !isTransitioning)
        {
            
            
            // Switch to Dawn if tutorial for Dusk is done
            if (_currentCharacter == _dusk && dusk_elixir_drunk)
            {
                isTransitioning = true;
                _metadata.setCurPlayer(_dawn);
                GetComponent<AudioSource>().Play();
                disableDusk();
                skyboxCtrl.DuskToDawn();
                fadeIn();
                StartCoroutine(enableDawnAfterTime(_transitionTime));
                
            }
            // Switch to Dusk if tutorial for Dawn is done
            else if (_currentCharacter == _dawn && dawn_elixir_drunk)
            {
                isTransitioning = true;
                _metadata.setCurPlayer(_dusk);
                GetComponent<AudioSource>().Play();
                disableDawn();
                skyboxCtrl.DawnToDusk();
                fadeIn();
                StartCoroutine(enableDuskAfterTime(_transitionTime));
            }
        }
    }

    IEnumerator enableDawnAfterTime(float time)
    {
        yield return new WaitForSeconds(time);
        // Setup metadata first
        
        _currentCharacter = _dawn;

        // Change lighting presets
        _dawnLighting.SetActive(true);
        _duskLighting.SetActive(false);
        _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = true;
        IEnumerator activateDawn(float time)
        {
            yield return new WaitForSeconds(time);
            enableDawn();
            switchedToDawn = true;
            isTransitioning = false;
        }
        fadeOut();
        StartCoroutine(activateDawn(_transitionTime));
    }

    public 
    

    IEnumerator enableDuskAfterTime(float time)
    {

        yield return new WaitForSeconds(time);
        // Setup metadata first
        _currentCharacter = _dusk;
        

        // Change lighting presets
        _dawnLighting.SetActive(false);
        _duskLighting.SetActive(true);

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

        //Disable all NPCs for Dusk
        npcListSetter(_duskNPCs, false);
    }

    private void disableDawn()
    {
        _dawn.GetComponent<ThreeDMovement>().enabled = false;
        _dawn.GetComponent<NPCInteract>().enabled = false;
        
        _currentdawnCamera.GetComponent<CinemachineVirtualCamera>().enabled = false;

        //Disable inventory toggling
        _dawnInventory.toggleHud(false);
        _dawnInventoryGameObject.SetActive(false);

        //Disable all NPCs for Dawn
        npcListSetter(_dawnNPCs, false);
    }

    private void enableDusk()
    {
        _dusk.GetComponent<ThreeDMovement>().enabled = true;
        _dusk.GetComponent<NPCInteract>().enabled = true;
       
        //Re-enable Inventory toggling
        _duskInventoryGameObject.SetActive(true);

        //Re-enable Dusk NPCs
        npcListSetter(_duskNPCs, true);
    }

    private void enableDawn()
    {
        _dawn.GetComponent<ThreeDMovement>().enabled = true;
        _dawn.GetComponent<NPCInteract>().enabled = true;

        //Re-enable Inventory toggling
        _dawnInventoryGameObject.SetActive(true);

        //Re-enable Dawn NPCs
        npcListSetter(_dawnNPCs, true);
    }

    private void npcListSetter(List<NPC> npcList, bool isEnabled)
    {
        foreach (NPC npc in npcList)
        {
            if (npc != null)
            {
                npc.enabled = isEnabled;
                if (isEnabled == false)
                {
                    // Disable any text if on
                    npc.deactivateNPC();
                }
            }
            
        }
    }



}