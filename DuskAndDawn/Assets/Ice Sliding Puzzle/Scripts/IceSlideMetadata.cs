using System.Collections;
using System.Collections.Generic;
using UnityEngine;

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
    }

    // Update is called once per frame
    void Update()
    {
        
        if (Input.GetKeyDown("r") && !dawnController.isSliding && !duskController.isSliding)
        {
            if (curPlayer == _dusk)
            {
                curPlayer = _dawn;
                _dusk.GetComponent<PlayerController>().enabled = false;
                _dawn.GetComponent<PlayerController>().enabled = true;
            } else
            {
                curPlayer = _dusk;
                _dawn.GetComponent<PlayerController>().enabled = false;
                _dusk.GetComponent<PlayerController>().enabled = true;
            }
        }

        checkWinCondition();

    }

    void checkWinCondition()
    {
        if (dawnMovePoint.transform.position.x == dawnExitX && dawnMovePoint.transform.position.y == dawnExitY && !dawnController.isSliding
            && duskMovePoint.transform.position.x == duskExitX && duskMovePoint.transform.position.y == duskExitY && !duskController.isSliding
            && !solvedPuzzle)
        {
            Debug.Log("Solved Puzzle!");
            solvedPuzzle = true;
        }
    }
}
