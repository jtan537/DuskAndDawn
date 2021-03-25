using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Video;
using Yarn.Unity;

public class IceSlideMetadata : MonoBehaviour
{
    [SerializeField]
    GameObject _dusk, _dawn;

    [SerializeField]
    IceSlidingInteract duskNPCInteract, dawnNPCInteract;


    public bool dawnInDialog, duskInDialog;
    public GameObject curPlayer;

    [Range(0, 11)]
    public int dawnEntranceX, dawnEntranceY, dawnExitX, dawnExitY;
        
    [Range(0, 11)]
    public int  duskEntranceX, duskEntranceY, duskExitX, duskExitY;

    [SerializeField]
    private Transform dawnMovePoint, duskMovePoint;

    PlayerController dawnController, duskController;
    bool solvedPuzzle = false;
    bool doneGame = false;

    VideoPlayer videoPlayer;
    VariableStorageBehaviour _varStorage;

    [SerializeField]
    GameObject videoRawImage;


    // Start is called before the first frame update
    void Start()
    {
        curPlayer = _dawn;
        _dawn.transform.position = new Vector3(dawnEntranceX, dawnEntranceY, _dawn.transform.position.z);
        dawnMovePoint.transform.position = _dawn.transform.position;
        _dusk.transform.position = new Vector3(duskEntranceX, duskEntranceY, _dusk.transform.position.z);
        duskMovePoint.transform.position = _dusk.transform.position;

        dawnController = _dawn.GetComponent<PlayerController>();
        duskController = _dusk.GetComponent<PlayerController>();
        
        dawnInDialog = dawnNPCInteract.isInDialog;
        duskInDialog = duskNPCInteract.isInDialog;
        videoRawImage.SetActive(false);
        videoPlayer = GameObject.Find("VideoPlayer").GetComponent<VideoPlayer>();
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
        GameObject.Find("Dawn").GetComponent<IceSlidingInteract>().Interact("IceSliding.OnSceneEnter");

        
    }


    // Update is called once per frame
    void Update()
    {
        dawnInDialog = dawnNPCInteract.isInDialog;
        duskInDialog = duskNPCInteract.isInDialog;

        if (!doneGame && !dawnController.isSliding && !duskController.isSliding
            && !dawnInDialog && !duskInDialog)
        {
            if (Input.GetKeyDown("r"))
            {
                if (curPlayer == _dusk)
                {
                    curPlayer = _dawn;
                    _dusk.GetComponent<PlayerController>().enabled = false;
                    _dawn.GetComponent<PlayerController>().enabled = true;
                }
                else
                {
                    curPlayer = _dusk;
                    _dawn.GetComponent<PlayerController>().enabled = false;
                    _dusk.GetComponent<PlayerController>().enabled = true;
                }
            }

            if (Input.GetKeyDown(KeyCode.Space))
            {
                _dawn.transform.position = new Vector3(dawnEntranceX, dawnEntranceY, _dawn.transform.position.z);
                dawnMovePoint.transform.position = _dawn.transform.position;
                _dusk.transform.position = new Vector3(duskEntranceX, duskEntranceY, _dusk.transform.position.z);
                duskMovePoint.transform.position = _dusk.transform.position;
            }
                
        }
        if (!dawnController.isSliding && !duskController.isSliding)
        {
            checkWinCondition();
        }

        checkSelectedDoneDialogue();

    }

    void checkWinCondition()
    {
        if (Input.GetKeyDown(KeyCode.F) && solvedPuzzle == true)
        {
            solvedPuzzle = false;
        }
        if (dawnMovePoint.transform.position.x == dawnExitX && dawnMovePoint.transform.position.y == dawnExitY && !dawnController.isSliding
            && duskMovePoint.transform.position.x == duskExitX && duskMovePoint.transform.position.y == duskExitY && !duskController.isSliding
            && !solvedPuzzle)
        {
            Debug.Log("Solved Puzzle!");
            GameObject.Find("Dawn").GetComponent<IceSlidingInteract>().Interact("IceSliding.DonePuzzle");
            solvedPuzzle = true;
        }
    }

    void checkSelectedDoneDialogue()
    {
        if (!doneGame && _varStorage.GetValue("$enter_tower_top").AsBool == true)
        {
            doneGame = true;
            _dusk.SetActive(false);
            _dawn.SetActive(false);
            GameObject.Find("SoundManager").GetComponent<SoundManager>().volume = 0;
            videoRawImage.SetActive(true);
            videoPlayer.Play();
        }
        
    }
}
